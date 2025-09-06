from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "ok", "message": "Flask API running"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9999)
