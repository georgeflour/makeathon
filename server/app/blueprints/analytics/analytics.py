import os
import json

def get_prediction():
    """
    This function is used to get a prediction from the AI model.
    It returns a JSON response with the prediction.
    It reads the chosen bundles from a JSON file and requests a prediction
    """
    bundles_path = os.path.join(os.path.dirname(__file__), 'json', 'chosen_bundles.json')
    with open(bundles_path, 'r') as f:
        chosen_bundles = json.load(f)
    try:
        data = request_ai_prediction(chosen_bundles)
        if not data:
            return {"error": "No data available for prediction"}, 404
        return {"prediction": data}, 200
    except Exception as e:
        return {"error": str(e)}, 500