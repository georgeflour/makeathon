# AI-Powered Bundling & Pricing Strategist 🎯

An intelligent e-commerce solution that leverages AI to create optimal product bundles and pricing strategies, helping retailers maximize revenue and customer satisfaction.

## 🌟 Features

### Bundle Discovery
- **Complementary Bundles**: Products frequently purchased together
- **Thematic Bundles**: Category-based product groupings
- **Volume Bundles**: Quantity-based discount packages
- **Cross-sell Bundles**: High-margin item combinations

### Price Optimization
- Machine learning-based pricing
- Revenue maximization algorithms

### Inventory Management
- Real-time stock tracking
- Automated bundle duration calculation
- Stock-based availability

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Jest for testing

### Backend
- Python
- Flask
- SQLite
- Pytest for testing

### Data Processing
- Pandas
- NumPy
- Scikit-learn
- Excel data handling

### Static Analysis
- Prettier
- Black
- Pylint

### Note
- Other tools like docker and github actions where used but because of the makeathon's limited time, did not manage to be delivered operational on time. For the competition's sake they are still published in the repository, so that judges can check their usage and the effort.
In order to not loose the AZURE_KEY we deleted the .env, so if judges need to run themselves the project, they need to create a .env file and add the elements below
```
AZURE_KEY=<your-key>
ENDPOINT=<your-endpoint>
STORAGE_ENDPOINT=<your-storage-endpoint
STORAGE_KEY=<your-key>
STORAGE_CONTAINER=<your-storage-container>
SEARCH_KEY=<search-key>
SEARCH_ENDPOINT=<search-endpoint>
SEARCH_INDEX_NAME=<searche-index-name>
```
- The project structure on the app presented to the judges is based on the server and client directories. The rest files make the architecture messy but are provided to show the rest of the work done during the makeathon.
  
## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.8+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/georgeflour/makeathon.git
cd makeathon
```

2. Set up the Python environment:
```bash
python3 -m venv venv            
source venv/bin/activate     
pip3 install -r requirements.txt
```

3. Set up the frontend:
```bash
# Navigate to client directory
cd client

# Install Node.js dependencies
npm install
```

4. Start the backend server:
```bash
# From the project root directory
cd server
flask run 
```
5. Start the frontend development server:
```bash
# In a new terminal, from the client directory
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📊 Project Structure

```
├── client/                     # Next.js frontend
│   ├── src/                   # Source files
│   ├── public/                # Static files
│   ├── __tests__/            # Frontend tests
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.ts    # Tailwind configuration
│   └── tsconfig.json         # TypeScript configuration
├── server/                    # Python backend
│   ├── app/                  # Application code
│   ├── tests/                # Backend tests
│   └── requirements.txt      # Backend dependencies
├── requirements.txt          # Main Python dependencies
├── pyproject.toml           # Python project configuration
└── pytest.ini              # Pytest configuration
```

## 🔧 Configuration

### Environment Variables

For competition's sake, the .env is published despite being a bad general practice. 


The frontend API configuration is handled in `next.config.js` and doesn't require additional environment variables.

### Required Data Files
Before running the application, ensure you have the following data files in the root directory:
- `Orders.xlsx`: Contains the order history data
- `Data.xlsx`: Contains additional product data
- `inventory_enriched.xlsx`: Contains enriched inventory information. 

The application will automatically create the necessary database files (`makeathon.db` and `bundles.db`) on first run.


## 🧪 Testing

### Frontend Tests
```bash
cd client
npm test
```

### Backend Tests
```bash
cd server
pytest
```
## App Demo 
- here is a quick overview of basic functionalities of the application

https://github.com/user-attachments/assets/1e215944-6f7e-4cce-81d4-8ffa11377185




## 🙏 Acknowledgments

- Makeathon 2025
- All contributors and supporters
- Open source community


---
Made with ❤️ for Makeathon 2025
