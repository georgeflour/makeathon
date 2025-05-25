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
- Real-time market adaptation
- Customer segment-specific pricing
- Revenue maximization algorithms

### Inventory Management
- Real-time stock tracking
- Automated bundle duration calculation
- Smart replenishment scheduling
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
- FastAPI
- SQLite
- Pytest for testing

### Data Processing
- Pandas
- NumPy
- Scikit-learn
- Excel data handling

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
# Create and activate Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
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
uvicorn app.main:app --reload --port 5000
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
├── data/                     # Data files
│   ├── Orders.xlsx          # Orders dataset
│   ├── Data.xlsx            # Additional data
│   └── inventory_enriched.xlsx # Enriched inventory data
├── scripts/                  # Utility scripts
│   ├── split_excel.py       # Excel file processing
│   ├── excel_to_txt.py      # Data conversion
│   └── inventory_sheet.py   # Inventory processing
├── requirements.txt          # Main Python dependencies
├── pyproject.toml           # Python project configuration
└── pytest.ini              # Pytest configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:
```env
DATABASE_URL=sqlite:///makeathon.db
```

The frontend API configuration is handled in `next.config.js` and doesn't require additional environment variables.

### Required Data Files
Before running the application, ensure you have the following data files in the root directory:
- `Orders.xlsx`: Contains the order history data
- `Data.xlsx`: Contains additional product data
- `inventory_enriched.xlsx`: Contains enriched inventory information

The application will automatically create the necessary database files (`makeathon.db` and `bundles.db`) on first run.

## 📈 Key Features

### 1. Bundle Discovery
- AI-powered product grouping
- Customer behavior analysis
- Sales pattern recognition
- Category-based bundling

### 2. Price Optimization
- ML-based price prediction
- Dynamic pricing strategies
- Revenue maximization
- Market condition adaptation

### 3. Inventory Management
- Real-time stock tracking
- Automated bundle duration
- Smart replenishment
- Stock-based availability

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

## 🔐 Security

- Encrypted data storage
- Secure API endpoints
- Role-based access control
- Regular security audits

## 📈 Performance

- Optimized database queries
- Regular performance monitoring
- Efficient data processing
- Caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Makeathon 2025
- All contributors and supporters
- Open source community

## 📞 Support

For support, email support@aibundling.com or join our Discord community.

---
Made with ❤️ for Makeathon 2025
