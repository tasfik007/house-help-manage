import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // Lazy initialization - read from localStorage only once on mount
  const [helpers, setHelpers] = useState(() => {
    const savedHelpers = localStorage.getItem("houseHelpers");
    return savedHelpers ? JSON.parse(savedHelpers) : [];
  });

  const [workRecords, setWorkRecords] = useState(() => {
    const savedWorkRecords = localStorage.getItem("workRecords");
    return savedWorkRecords ? JSON.parse(savedWorkRecords) : {};
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showAddHelper, setShowAddHelper] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [salaryData, setSalaryData] = useState(null);

  const [newHelper, setNewHelper] = useState({
    name: "",
    nid: "",
    perUnitTaka: "",
  });

  const [modalData, setModalData] = useState({
    helperId: "",
    units: 0,
  });

  // Save to localStorage whenever helpers change
  useEffect(() => {
    localStorage.setItem("houseHelpers", JSON.stringify(helpers));
  }, [helpers]);

  // Save to localStorage whenever workRecords change
  useEffect(() => {
    localStorage.setItem("workRecords", JSON.stringify(workRecords));
  }, [workRecords]);

  const addHelper = (e) => {
    e.preventDefault();
    if (newHelper.name && newHelper.nid && newHelper.perUnitTaka) {
      const helper = {
        id: Date.now().toString(),
        ...newHelper,
      };
      setHelpers([...helpers, helper]);
      setNewHelper({ name: "", nid: "", perUnitTaka: "" });
      setShowAddHelper(false);
    }
  };

  const deleteHelper = (helperId, helperName) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${helperName}? This will also delete all their work records.`
    );

    if (confirmed) {
      // Remove the helper
      setHelpers(helpers.filter((h) => h.id !== helperId));

      // Remove all work records for this helper
      const updatedRecords = { ...workRecords };
      Object.keys(updatedRecords).forEach((dateKey) => {
        if (updatedRecords[dateKey][helperId]) {
          delete updatedRecords[dateKey][helperId];
          // If no helpers left for this date, remove the date entry
          if (Object.keys(updatedRecords[dateKey]).length === 0) {
            delete updatedRecords[dateKey];
          }
        }
      });
      setWorkRecords(updatedRecords);
    }
  };

  const calculateSalary = (helperId, helperName, perUnitTaka) => {
    let totalUnits = 0;

    // Calculate total units for the selected month/year
    Object.keys(workRecords).forEach((dateKey) => {
      const parts = dateKey.split("-");
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);

      // Check if this date is in the selected month/year
      if (year === selectedYear && month === selectedMonth + 1) {
        if (workRecords[dateKey][helperId]) {
          const units = workRecords[dateKey][helperId];
          totalUnits += units;
        }
      }
    });

    const monthlyRate = parseFloat(perUnitTaka);
    const dailyRate = monthlyRate / 30;
    const totalSalary = dailyRate * totalUnits;

    setSalaryData({
      helperName,
      month: months[selectedMonth],
      year: selectedYear,
      totalUnits,
      totalSalary: totalSalary.toFixed(2),
    });
    setShowSalaryModal(true);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${selectedMonth + 1}-${day}`;
      const hasWork =
        workRecords[dateKey] && Object.keys(workRecords[dateKey]).length > 0;

      days.push(
        <div
          key={day}
          className={`calendar-day ${hasWork ? "has-work" : ""}`}
          onClick={() => handleDayClick(day)}
        >
          <span className="day-number">{day}</span>
          {hasWork && <div className="work-indicator">●</div>}
        </div>
      );
    }

    return days;
  };

  const handleDayClick = (day) => {
    setSelectedDate({ year: selectedYear, month: selectedMonth, day });
    const dateKey = `${selectedYear}-${selectedMonth + 1}-${day}`;
    setModalData({ helperId: "", units: 0 });
    setShowWorkModal(true);
  };

  const handleSaveWork = () => {
    if (modalData.helperId && selectedDate) {
      const dateKey = `${selectedDate.year}-${selectedDate.month + 1}-${
        selectedDate.day
      }`;
      const updatedRecords = { ...workRecords };

      if (!updatedRecords[dateKey]) {
        updatedRecords[dateKey] = {};
      }

      if (modalData.units > 0) {
        updatedRecords[dateKey][modalData.helperId] = modalData.units;
      } else {
        delete updatedRecords[dateKey][modalData.helperId];
        if (Object.keys(updatedRecords[dateKey]).length === 0) {
          delete updatedRecords[dateKey];
        }
      }

      setWorkRecords(updatedRecords);
      setShowWorkModal(false);
      setModalData({ helperId: "", units: 0 });
    }
  };

  const getCurrentDateWork = () => {
    if (!selectedDate) return {};
    const dateKey = `${selectedDate.year}-${selectedDate.month + 1}-${
      selectedDate.day
    }`;
    return workRecords[dateKey] || {};
  };

  const clearMonthData = () => {
    console.log("Clear button clicked");
    console.log("Current workRecords:", workRecords);
    console.log(
      "Selected month:",
      selectedMonth,
      "Selected year:",
      selectedYear
    );

    const confirmed = window.confirm(
      `Are you sure you want to clear all work records for ${months[selectedMonth]} ${selectedYear}? This action cannot be undone.`
    );

    if (confirmed) {
      console.log("User confirmed deletion");
      const updatedRecords = {};
      let deletedCount = 0;

      // Keep only records that don't match the selected month/year
      Object.keys(workRecords).forEach((dateKey) => {
        const parts = dateKey.split("-");
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        console.log(
          `Checking dateKey: ${dateKey}, year: ${year}, month: ${month}`
        );

        // If this record is NOT from the selected month/year, keep it
        if (year !== selectedYear || month !== selectedMonth + 1) {
          updatedRecords[dateKey] = workRecords[dateKey];
          console.log(`Keeping ${dateKey}`);
        } else {
          deletedCount++;
          console.log(`Deleting ${dateKey}`);
        }
      });

      console.log(
        `Total deleted: ${deletedCount} records for ${months[selectedMonth]} ${selectedYear}`
      );
      console.log("Updated records:", updatedRecords);

      setWorkRecords(updatedRecords);
    } else {
      console.log("User cancelled deletion");
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>বুয়া আসছে কি আসে নাই</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddHelper(!showAddHelper)}
        >
          {showAddHelper ? "বাতিল" : "বুয়া যোগ করুন"}
        </button>
      </header>

      {showAddHelper && (
        <div className="add-helper-form">
          <h2>নতুন বুয়া যোগ করুন</h2>
          <form onSubmit={addHelper}>
            <div className="form-group">
              <label>নাম:</label>
              <input
                type="text"
                value={newHelper.name}
                onChange={(e) =>
                  setNewHelper({ ...newHelper, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>এনাইডি নম্বর:</label>
              <input
                type="text"
                value={newHelper.nid}
                onChange={(e) =>
                  setNewHelper({ ...newHelper, nid: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>প্রত্যেক কাজের জন্য কত পাবে?</label>
              <input
                type="number"
                value={newHelper.perUnitTaka}
                onChange={(e) =>
                  setNewHelper({ ...newHelper, perUnitTaka: e.target.value })
                }
                required
              />
            </div>
            <button type="submit" className="btn btn-success">
              বুয়া যোগ করুন
            </button>
          </form>
        </div>
      )}

      <div className="helpers-list">
        <h2>বুয়া ({helpers.length})</h2>
        <div className="helpers-grid">
          {helpers.map((helper) => (
            <div key={helper.id} className="helper-card">
              <button
                className="delete-helper-btn"
                onClick={() => deleteHelper(helper.id, helper.name)}
                title="Remove বুয়া"
              >
                ×
              </button>
              <h3>{helper.name}</h3>
              <p>
                <strong>এনাআইডি:</strong> {helper.nid}
              </p>
              <p>
                <strong>প্রতি কাজের জন্য পাবে:</strong> ৳{helper.perUnitTaka}
              </p>
              <button
                className="btn btn-primary pay-salary-btn"
                onClick={() =>
                  calculateSalary(helper.id, helper.name, helper.perUnitTaka)
                }
              >
                বেতন দিন
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-controls">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from(
              { length: 10 },
              (_, i) => new Date().getFullYear() - 5 + i
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button className="btn btn-danger" onClick={clearMonthData}>
            Clear Month Data
          </button>
        </div>

        <div className="calendar">
          <div className="calendar-header">
            <div className="calendar-day-name">Sun</div>
            <div className="calendar-day-name">Mon</div>
            <div className="calendar-day-name">Tue</div>
            <div className="calendar-day-name">Wed</div>
            <div className="calendar-day-name">Thu</div>
            <div className="calendar-day-name">Fri</div>
            <div className="calendar-day-name">Sat</div>
          </div>
          <div className="calendar-grid">{renderCalendar()}</div>
        </div>
      </div>

      {showWorkModal && (
        <div className="modal-overlay" onClick={() => setShowWorkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              Work for {months[selectedDate.month]} {selectedDate.day},{" "}
              {selectedDate.year}
            </h2>

            <div className="form-group">
              <label>কোন বুয়া:</label>
              <select
                value={modalData.helperId}
                onChange={(e) => {
                  const helperId = e.target.value;
                  const currentWork = getCurrentDateWork();
                  setModalData({
                    helperId,
                    units: currentWork[helperId] || 0,
                  });
                }}
              >
                <option value="">-- বুয়া বাছাই করুন --</option>
                {helpers.map((helper) => (
                  <option key={helper.id} value={helper.id}>
                    {helper.name}
                  </option>
                ))}
              </select>
            </div>

            {modalData.helperId && (
              <div className="form-group">
                <label>Unit Work:</label>
                <div className="unit-control">
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setModalData({
                        ...modalData,
                        units: Math.max(0, modalData.units - 1),
                      })
                    }
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={modalData.units}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        units: Math.max(0, Number(e.target.value)),
                      })
                    }
                    min="0"
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setModalData({
                        ...modalData,
                        units: modalData.units + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="current-work">
              <h3>Work Recorded for This Day:</h3>
              {Object.keys(getCurrentDateWork()).length > 0 ? (
                <ul>
                  {Object.entries(getCurrentDateWork()).map(
                    ([helperId, units]) => {
                      const helper = helpers.find((h) => h.id === helperId);
                      return helper ? (
                        <li key={helperId}>
                          {helper.name}: {units} units
                        </li>
                      ) : null;
                    }
                  )}
                </ul>
              ) : (
                <p>No work recorded yet.</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSaveWork}>
                Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowWorkModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSalaryModal && salaryData && (
        <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
          <div className="salary-modal" onClick={(e) => e.stopPropagation()}>
            <h2>বেতনের তথ্য</h2>
            <div className="salary-details">
              <div className="salary-row">
                <span className="salary-label">বুয়ার নাম:</span>
                <span className="salary-value">{salaryData.helperName}</span>
              </div>
              <div className="salary-row">
                <span className="salary-label">মাস:</span>
                <span className="salary-value">{salaryData.month} {salaryData.year}</span>
              </div>
              <div className="salary-row">
                <span className="salary-label">মোট ইউনিট:</span>
                <span className="salary-value">{salaryData.totalUnits}</span>
              </div>
              <div className="salary-total">
                <span className="total-label">মোট বেতন:</span>
                <span className="total-amount">৳{salaryData.totalSalary}</span>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowSalaryModal(false)}
              style={{ width: '100%', marginTop: '20px' }}
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
