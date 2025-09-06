from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json(silent=True) or {}
    name = data.get('name')
    return jsonify({'id': 1, 'name': name}), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8888)