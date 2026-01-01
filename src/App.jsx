import { useState, useEffect } from 'react'
import './App.css'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
function App() {

  // state to store the raw list of salaries
  const [salaryData, setSalaryData] = useState([]);
  // state for final qualified offer
  const [qualifyingOffer, setQualifyingOffer] = useState(0);
  // store most recent year for display
  const [mostRecentYear, setMostRecentYear] = useState(null);
  // UI status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // search function in table
  const [searchTerm, setSearchTerm] = useState('');
  // create the chart data
  const chartData = salaryData.slice(0, 125).map((item, index) => ({
    rank: index + 1,
    salary: item.salary,
  }));
  // table data
  const tableData = searchTerm.trim() === '' 
  ? salaryData.slice(0, 10)
  : salaryData.filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

  useEffect(() => {
    // async function to fetch the data
    const getData = async () => {
      try {
        const response = await fetch('/swe/data.html');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const htmlString = await response.text();

        // Parse html string
        const parser = new DOMParser();
        const document = parser.parseFromString(htmlString, 'text/html');

        // we want the salaries rows
        const rows = document.querySelectorAll('#salaries-table tbody tr');
        // store raw salaries 
        const rawSalaries = [];

        // parse each row in document
        rows.forEach((row) => {
          // Get all the cells in this row
          const cells = row.querySelectorAll('td');
          // error check to make sure this row has all the columns
          if (cells.length > 2) {
            const nameText = cells[0].textContent; // player name
            const salaryText = cells[1].textContent; // salary str
            const yearText = cells[2].textContent; // year
            const levelText = cells[3].textContent; // Level
            const cleanSalary = salaryText.replace(/[$,\s]/g, '');
            const salary = parseFloat(cleanSalary);
            const year = parseInt(yearText.trim());
            // no need for level later, so we filter non-MLB players here
            if (!isNaN(salary) && isFinite(salary) && !isNaN(year) && levelText.trim() === 'MLB') {
              // NEW: Store the name object property
              rawSalaries.push({ name: nameText, salary, year });
            }
          }
        });
        if (rawSalaries.length === 0) throw new Error("No valid data found.");

        // filter for only the most recent year
        const mostRecentYear = Math.max(...rawSalaries.map(item => item.year));
        setMostRecentYear(mostRecentYear);
        var validSalaries = rawSalaries.filter(item => item.year === mostRecentYear);

        // sort by highest salary
        validSalaries.sort((a, b) => b.salary - a.salary);

        // calculate average
        const top125 = validSalaries.slice(0, 125);
        const sum = top125.reduce((a, b) => a + b.salary, 0);
        const average = sum / top125.length;

        // store the data
        setSalaryData(validSalaries);
        setQualifyingOffer(average);
        console.log('There are ', validSalaries.length, ' salaries in ', mostRecentYear);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // call the function
    getData();
  }, []);

  // Ensure we display in USD, and correct format 
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0, 
    }).format(value);
  };

  return (
    <div className="container">
      <header>
        <h1>Phillies Upcoming Qualifying Offer</h1>
      </header>
      <main>
        {loading && <div className="loading">Scouting the data...</div>}
        {error && <div className="error">Error: {error}</div>}
        {!loading && !error && (
          <>
          <div className="result-card">
            <h2>
              {mostRecentYear ? `${mostRecentYear} Qualifying Offer` : 'Projected Qualifying Offer'}
            </h2>
            <div className="big-number">
              {formatCurrency(qualifyingOffer)}
            </div>
            <p>Based on the average of the top 125 salaries.</p>
          </div>
          <div className="stats-dashboard">
              <div className="chart-section">
                <h3>Top 125 Salary Distribution</h3>
                <p className="chart-subtitle">Visualizing the salary curve</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="rank" />
                     <YAxis tickFormatter={(val) => `$${val/1000000}M`} width={50} />
                     <Tooltip formatter={(val) => formatCurrency(val)} />
                     <Bar dataKey="salary" fill="#E81828" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="table-section">
                <h3>Top Earners</h3>
                <input 
                  type="text" 
                  placeholder="Search player..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Player</th>
                        <th>Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.length > 0 ? (
                        tableData.map((player, index) => (
                          <tr key={index}>
                            <td className="rank-cell">
                              {searchTerm ? salaryData.indexOf(player) + 1 : index + 1}
                            </td>
                            <td className="name-cell">{player.name}</td>
                            <td className="salary-cell">{formatCurrency(player.salary)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>
                            No players found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        </>
        )}
      </main>
    </div>
  )
}

export default App