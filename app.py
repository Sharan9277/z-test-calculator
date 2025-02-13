import math
import numpy as np
from scipy import stats
from flask import Flask, request, jsonify
import matplotlib.pyplot as plt
import io
import base64
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Function to calculate Z-Score
def calculate_z_score(sample_mean, hypothesized_mean, population_sd, sample_size):
    return (sample_mean - hypothesized_mean) / (population_sd / np.sqrt(sample_size))

# Function to calculate p-value for different alternative hypotheses
def calculate_p_value(z_score, alternative_hypothesis):
    if alternative_hypothesis == 'two-tailed':
        p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))
    elif alternative_hypothesis == 'left-tailed':
        p_value = stats.norm.cdf(z_score)
    else:  # right-tailed
        p_value = 1 - stats.norm.cdf(z_score)
    return p_value

# Function to calculate critical value based on significance level
def get_critical_value(alpha, alternative_hypothesis):
    if alternative_hypothesis == 'two-tailed':
        return stats.norm.ppf(1 - alpha / 2)  # Two-tailed
    else:
        return stats.norm.ppf(1 - alpha)  # Left or Right tailed

# Function to calculate rejection region
def get_rejection_region(critical_value, alternative_hypothesis):
    if alternative_hypothesis == 'two-tailed':
        return f"Reject Null Hypothesis if Z < {-critical_value} or Z > {critical_value}"
    elif alternative_hypothesis == 'left-tailed':
        return f"Reject Null Hypothesis if Z < {-critical_value}"
    else:  # right-tailed
        return f"Reject Null Hypothesis if Z > {critical_value}"

# Function to calculate confidence interval
def calculate_confidence_interval(sample_mean, population_sd, sample_size, critical_value):
    margin_of_error = critical_value * (population_sd / np.sqrt(sample_size))
    return (sample_mean - margin_of_error, sample_mean + margin_of_error)

# Function to generate the Z-Test graph
def generate_z_test_graph(z_statistic, critical_value, test_type):
    x = np.linspace(-4, 4, 1000)
    y = stats.norm.pdf(x)

    fig, ax = plt.subplots()
    ax.plot(x, y, label='Normal Distribution', color='blue')

    # Filling the rejection region
    if test_type == 'two-tailed':
        ax.fill_between(x, y, where=(x < -critical_value) | (x > critical_value), color='red', alpha=0.5)
    elif test_type == 'left-tailed':
        ax.fill_between(x, y, where=(x < -critical_value), color='red', alpha=0.5)
    else:  # right-tailed
        ax.fill_between(x, y, where=(x > critical_value), color='red', alpha=0.5)

    # Plotting the z-statistic
    ax.axvline(x=z_statistic, color='green', linestyle='--', label=f'Z-statistic = {z_statistic:.2f}')
    
    ax.set_title('Z-Test Graph')
    ax.legend()
    
    # Save graph to a byte stream and convert to base64 for frontend
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_data = base64.b64encode(buf.read()).decode('utf-8')
    
    return img_data

# Route for calculating Z-test
@app.route('/calculate', methods=['POST'])
def calculate_z_test():
    # Extracting data from the POST request
    data = request.json

    # Converting inputs to float to ensure correct mathematical operations
    sample_mean = float(data['sample_mean'])
    hypothesized_mean = float(data['population_mean'])
    population_sd = float(data['population_std_dev'])
    sample_size = int(data['sample_size'])  # sample size is typically an integer
    significance_level = float(data['significance_level'])
    test_type = data['test_type']  # 'two_tailed', 'left_tailed', 'right_tailed'
    approach = data['approach']    # 'p_value', 'critical_value'

    # Z-Statistic Calculation
    z_statistic = calculate_z_score(sample_mean, hypothesized_mean, population_sd, sample_size)

    # Critical Value Calculation
    critical_value = get_critical_value(significance_level, test_type)

    # Rejection Region
    rejection_region = get_rejection_region(critical_value, test_type)

    # Decision based on p-value approach
    if approach == 'p_value':
        p_value = calculate_p_value(z_statistic, test_type)
        decision = "Reject Null Hypothesis" if p_value < significance_level else "Fail to Reject Null Hypothesis"
    else:
        # For now, we ignore the critical_value approach, as per the instructions
        p_value = None
        decision = "Invalid approach"

    # Conclusion
    conclusion = "There is enough evidence to reject the null hypothesis" if decision == "Reject Null Hypothesis" else "There is not enough evidence to reject the null hypothesis"

    # Confidence Interval
    confidence_interval = calculate_confidence_interval(sample_mean, population_sd, sample_size, critical_value)

    # Generate Graph
    graph_image = generate_z_test_graph(z_statistic, critical_value, test_type)

    # Response
    return jsonify({
        'table_data': [
            {"Parameter": "Sample Mean", "Value": sample_mean},
            {"Parameter": "Population Mean", "Value": hypothesized_mean},
            {"Parameter": "Population Standard Deviation", "Value": population_sd},
            {"Parameter": "Sample Size", "Value": sample_size},
            {"Parameter": "Significance Level (alpha)", "Value": significance_level},
            {"Parameter": "Alternative Hypothesis", "Value": test_type},
            {"Parameter": "Approach", "Value": approach}
        ],
        'null_alternative': f"The following null and alternative hypotheses need to be tested: μ = {hypothesized_mean}, Alternative Hypothesis: μ ≠ {hypothesized_mean}",
        'test_type': f"Test Type: {test_type.capitalize()}",
        'rejection_region': rejection_region,
        'z_statistic_computation': {
            'formula': f"Z = (Sample Mean - Population Mean) / (Population Std Dev / √Sample Size)",
            'computation': f"Z = ({sample_mean} - {hypothesized_mean}) / ({population_sd} / √{sample_size}) = {z_statistic:.2f}"
        },
        'decision': {
            'p_value': p_value,
            'decision': decision,
            'explanation': f"The p-value is {p_value:.4f}. Since the p-value {'is less than' if decision == 'Reject Null Hypothesis' else 'is greater than'} the significance level, we {'reject' if decision == 'Reject Null Hypothesis' else 'fail to reject'} the null hypothesis."
        },
        'conclusion': conclusion,
        'confidence_interval': {
            'formula': "Confidence Interval = Sample Mean ± (Critical Value * (Population Std Dev / √Sample Size))",
            'computation': f"Confidence Interval = {sample_mean} ± ({critical_value} * ({population_sd} / √{sample_size})) = {confidence_interval[0]:.2f} to {confidence_interval[1]:.2f}"
        },
        'graph_image': graph_image
    })

if __name__ == '__main__':
    app.run(debug=True)
