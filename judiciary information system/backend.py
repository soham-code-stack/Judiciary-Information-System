import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

class CaseHandler(BaseHTTPRequestHandler):
    """HTTP handler for case management"""
    
    def do_GET(self):
        """Handle GET requests - serve frontend or get cases"""
        if self.path == '/cases':
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            cases = self.load_cases()
            self.wfile.write(json.dumps(cases).encode())
            
        elif self.path == '/':
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Judiciary System Backend</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .status { padding: 10px; background: #e8f5e8; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🤖 Judiciary System Backend</h1>
                    <div class="status">
                        <p>✅ Backend server is running successfully!</p>
                        <p>📊 Total cases stored: <span id="caseCount">Loading...</span></p>
                        <p>🌐 Frontend is automatically connected to this backend</p>
                    </div>
                    <p><strong>Server is running on:</strong> http://localhost:5000</p>
                    <p><strong>Endpoints:</strong></p>
                    <ul>
                        <li><code>GET /cases</code> - Get all cases</li>
                        <li><code>POST /cases</code> - Add/update cases</li>
                    </ul>
                </div>
                <script>
                    // Show case count
                    fetch('/cases')
                        .then(r => r.json())
                        .then(cases => {
                            document.getElementById('caseCount').textContent = cases.length;
                        });
                </script>
            </body>
            </html>
            """
            self.wfile.write(html_content.encode())
            
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle POST requests - save cases"""
        if self.path == '/cases':
            # Get the posted data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                cases = json.loads(post_data.decode())
                self.save_cases(cases)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": f"Saved {len(cases)} cases"}).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
                
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def load_cases(self):
        """Load cases from JSON file"""
        try:
            if os.path.exists('cases_data.json'):
                with open('cases_data.json', 'r') as f:
                    return json.load(f)
        except:
            pass
        return []
    
    def save_cases(self, cases):
        """Save cases to JSON file"""
        with open('cases_data.json', 'w') as f:
            json.dump(cases, f, indent=2)

class CaseAnalyzer:
    """Analyze cases with AI-like features"""
    
    def __init__(self, cases):
        self.cases = cases
    
    def calculate_priority_score(self, case):
        """Calculate case priority using simple algorithm"""
        if not case:
            return 0
            
        score = 0
        
       
        type_weights = {"Criminal": 0.8, "Civil": 0.5, "Family": 0.6, "Property": 0.7}
        score += type_weights.get(case.get("type", "Civil"), 0.5) * 40
        
        
        severity_weights = {"Low": 0.3, "Medium": 0.6, "High": 0.8, "Critical": 1.0}
        score += severity_weights.get(case.get("severity", "Medium"), 0.5) * 40
        
        
        status_weights = {"Pending": 0.9, "Active": 1.0, "Solved": 0.1}
        score *= status_weights.get(case.get("status", "Pending"), 1.0)
        
        
        description = case.get("description", "")
        word_count = len(description.split())
        complexity = min(word_count / 50, 1.0)
        score += complexity * 20
        
        return min(score, 100)
    
    def generate_insights(self):
        """Generate AI-like insights"""
        if not self.cases:
            return {"error": "No cases available"}
        
        total_cases = len(self.cases)
        
        
        status_count = {}
        criminal_cases = []
        high_severity = []
        
        for case in self.cases:
            status = case.get("status", "Pending")
            status_count[status] = status_count.get(status, 0) + 1
            
            if case.get("type") == "Criminal":
                criminal_cases.append(case)
            
            if case.get("severity") in ["High", "Critical"]:
                high_severity.append(case)
        
        
        priority_scores = [self.calculate_priority_score(c) for c in self.cases]
        avg_priority = sum(priority_scores) / len(priority_scores) if priority_scores else 0
        
        return {
            "total_cases": total_cases,
            "status_distribution": status_count,
            "criminal_cases": len(criminal_cases),
            "high_severity_cases": len(high_severity),
            "average_priority_score": round(avg_priority, 2),
            "analysis_timestamp": datetime.now().isoformat()
        }

def start_server():
    """Start the HTTP server"""
    server = HTTPServer(('localhost', 5000), CaseHandler)
    print("🚀 Judiciary System Backend Server Started!")
    print("📍 Running on: http://localhost:5000")
    print("📊 Frontend will automatically connect to this backend")
    print("⏹️  Press Ctrl+C to stop the server")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")

if __name__ == "__main__":
    start_server()