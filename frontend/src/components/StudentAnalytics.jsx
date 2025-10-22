// src/components/StudentAnalytics.jsx
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Nav, Tab, Button, Form, Table, ProgressBar } from "react-bootstrap";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { AuthContext } from "./AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faBook,
  faBullseye,
  faClipboardList,
  faFilter,
  faDownload,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import "./StudentAnalytics.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StudentAnalytics = () => {
  const { username } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("datewise");
  const [viewOption, setViewOption] = useState("combined");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [viewMode, setViewMode] = useState("all"); // all, homework, classwork
  
  // Mock data for the student
  const studentData = {
    name: username || "Student",
    class: "Class 10th",
    studentId: "10HPS17",
  };

  // Date-wise progression data for line chart
  const dateWiseData = {
    labels: [
      "Aug 31", "Sep 1", "Sep 2", "Sep 3", "Sep 4", "Sep 5", "Sep 6", 
      "Sep 7", "Sep 8", "Sep 9", "Sep 10", "Sep 11", "Sep 12", "Sep 13",
      "Sep 14", "Sep 15", "Sep 16", "Sep 17", "Sep 18", "Sep 19", "Sep 20",
      "Sep 21", "Sep 23", "Sep 25", "Sep 27", "Sep 29"
    ],
    datasets: [
      {
        label: "Homework Performance (%)",
        data: [60, 58, 62, 64, 65, 67, 66, 68, 70, 69, 71, 70, 72, 71, 73, 72, 74, 73, 75, 74, 75, 76, 75, 77, 76, 78],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Classwork Performance (%)",
        data: [58, 60, 61, 63, 62, 64, 65, 66, 67, 68, 69, 68, 70, 69, 71, 70, 72, 71, 73, 72, 73, 74, 73, 75, 74, 75],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: true,
        text: "Score Comparison Over Time with All Submission Dates",
        font: {
          size: 14,
          weight: "normal",
        },
        padding: 20,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          callback: function(value) {
            return value;
          }
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        title: {
          display: false,
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        }
      },
    },
  };

  // Chapter Analysis data
  const chapterData = {
    labels: [
      "Calculus Integration", "Algebra Linear Equations", "Geometry", 
      "Algebra - System of Equations", "Algebra", "Probability",
      "Trigonometry", "Quadratic Equations", "Calculus Derivatives",
      "Functions and Graphs", "Coordinate Geometry"
    ],
    datasets: [
      {
        label: "Homework Performance",
        data: [92, 88, 95, 85, 78, 82, 75, 72, 78, 85, 90],
        backgroundColor: "rgba(75, 192, 192, 0.8)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
      },
      {
        label: "Classwork Performance",
        data: [60, 85, 75, 65, 62, 65, 58, 60, 68, 82, 85],
        backgroundColor: "rgba(255, 99, 132, 0.8)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: true,
        text: "Topic Analysis - Performance comparison across different topics",
        font: {
          size: 14,
          weight: "normal",
        },
        padding: 20,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Mistake Analysis data
  const mistakeData = {
    labels: ["Correct", "Partially-Correct", "Numerical Error", "Irrelevant", "Unattempted"],
    datasets: [{
      data: [72, 20, 27, 35, 26],
      backgroundColor: [
        'rgba(75, 192, 75, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(128, 128, 128, 0.8)'
      ],
      borderColor: [
        'rgba(75, 192, 75, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(128, 128, 128, 1)'
      ],
      borderWidth: 1,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(0);
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i,
                  pointStyle: 'circle',
                };
              });
            }
            return [];
          }
        }
      },
      title: {
        display: true,
        text: 'How Well Did I Do? (Answer Categories)',
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value} questions`;
          }
        }
      }
    },
  };

  // Filtered Results data
  const filteredResults = [
    { id: "Q1", chapter: "Algebra - Linear Equations", date: "8/30/2025", question: "Find the shortest distance...", score: "15/20", performance: 73, status: "CORRECT", studentMistake: "Irrelevant formula application", approach: "Minimize the distance function using calculus" },
    { id: "Q2", chapter: "Trigonometry", date: "8/31/2025", question: "Find the vertex of parabola...", score: "15/20", performance: 75, status: "CORRECT", studentMistake: "Fig = 5", approach: "Minimize the distance function using calculus" },
    { id: "Q3", chapter: "Calculus - Integration", date: "8/1/2025", question: "Find the system solution...", score: "15/20", performance: 77, status: "CORRECT", studentMistake: "Sy = 6", approach: "Minimize the distance function using calculus" },
    { id: "Q4", chapter: "Coordinate Geometry", date: "8/2/2025", question: "Find the equation of line...", score: "15/20", performance: 78, status: "CORRECT", studentMistake: "Area = ½ × base × height", approach: "Minimize the distance function using calculus" },
    { id: "Q5", chapter: "Statistics", date: "8/3/2025", question: "Find the trigonometric value...", score: "15/20", performance: 81, status: "CORRECT", studentMistake: "cos(60°) = 0.5", approach: "Minimize the distance function using calculus" },
    { id: "Q6", chapter: "Probability", date: "9/4/2025", question: "Find the shortest distance...", score: "17/20", performance: 83, status: "CORRECT", studentMistake: "Calculation error", approach: "Minimize the distance function using calculus" },
    { id: "Q7", chapter: "Quadratic Applications", date: "9/5/2025", question: "Find the vertex of parabola...", score: "17/20", performance: 85, status: "CORRECT", studentMistake: "Minor oversight", approach: "Minimize the distance function using calculus" },
    { id: "Q8", chapter: "Algebra - Linear Equations", date: "9/6/2025", question: "Find the system solution...", score: "17/20", performance: 87, status: "PARTIAL", studentMistake: "Irrelevant formula application", approach: "Minimize the distance function using calculus" },
    { id: "Q9", chapter: "Trigonometry", date: "9/7/2025", question: "Find the equation of line...", score: "18/20", performance: 89, status: "PARTIAL", studentMistake: "Fig = 5", approach: "Minimize the distance function using calculus" },
    { id: "Q10", chapter: "Calculus - Integration", date: "9/8/2025", question: "Find the trigonometric value...", score: "18/20", performance: 91, status: "PARTIAL", studentMistake: "Sy = 6", approach: "Minimize the distance function using calculus" },
    { id: "Q11", chapter: "Coordinate Geometry", date: "9/9/2025", question: "Find the shortest distance...", score: "19/20", performance: 93, status: "PARTIAL", studentMistake: "Area = ½ × base × height", approach: "Minimize the distance function using calculus" },
  ];

  // Summary Statistics
  const summaryStats = {
    assessments: 30,
    chapters: 10,
    questions: 150,
    accuracy: 43,
    homeworkAvg: 67,
    classworkAvg: 70,
    performanceGap: -3,
    improvementRate: 13,
  };

  // Priority Chapters data
  const priorityChapters = {
    high: ["Calculus - Integration"],
    medium: ["Quadratic Applications"],
    maintain: ["Trigonometry"],
  };

  return (
    <Container fluid className="student-analytics-container p-4">
      {/* Header */}
      <div className="analytics-header mb-4">
        <h4 className="mb-1">
          <FontAwesomeIcon icon={faChartLine} className="me-2" />
          Student Analysis Dashboard
        </h4>
        <p className="text-muted mb-0">Analyzing performance for {studentData.name} ({studentData.studentId})</p>
      </div>

      {/* Main Tabs */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="pills" className="analytics-tabs mb-4">
          <Nav.Item>
            <Nav.Link eventKey="datewise" className="px-4">
              <FontAwesomeIcon icon={faChartLine} className="me-2" />
              Score- Date-wise progression
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="chapter" className="px-4">
              <FontAwesomeIcon icon={faBook} className="me-2" />
              Chapter Analysis
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="mistakes" className="px-4">
              <FontAwesomeIcon icon={faBullseye} className="me-2" />
              Mistake-Progress-Analysis
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="summary" className="px-4">
              <FontAwesomeIcon icon={faClipboardList} className="me-2" />
              Summary
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Date-wise Progression Tab */}
          <Tab.Pane eventKey="datewise">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-gradient-primary text-white p-3">
                <div className="d-flex flex-column gap-3">
                  <h6 className="mb-0">
                    📊 Homework vs Classwork: Date-wise Performance Analysis
                  </h6>
                  <div className="view-options d-flex gap-2 ms-auto">
                    <Button 
                      size="sm" 
                      variant={viewOption === 'combined' ? 'light' : 'outline-light'}
                      onClick={() => setViewOption('combined')}
                      className="view-toggle-btn"
                    >
                      📊 Combined View
                    </Button>
                    <Button 
                      size="sm" 
                      variant={viewOption === 'homework' ? 'light' : 'outline-light'}
                      onClick={() => setViewOption('homework')}
                      className="view-toggle-btn"
                    >
                      📘 Homework Only
                    </Button>
                    <Button 
                      size="sm" 
                      variant={viewOption === 'classwork' ? 'light' : 'outline-light'}
                      onClick={() => setViewOption('classwork')}
                      className="view-toggle-btn"
                    >
                      📗 Classwork Only
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: "400px", padding: "20px" }}>
                  <Line 
                    data={{
                      ...dateWiseData,
                      datasets: viewOption === 'combined' ? dateWiseData.datasets :
                               viewOption === 'homework' ? [dateWiseData.datasets[0]] :
                               [dateWiseData.datasets[1]]
                    }}
                    options={lineChartOptions} 
                  />
                </div>
                <div className="text-end mt-3">
                  <span className="badge bg-warning text-dark me-2">Improvement Trend: 13% per assignment</span>
                </div>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Chapter Analysis Tab */}
          <Tab.Pane eventKey="chapter">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-info text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">📚 Topic Analysis</h6>
                  <div className="view-options d-flex gap-2">
                    <Button size="sm" variant="light">
                      📊 View Options
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: "400px", padding: "20px" }}>
                  <Bar data={chapterData} options={barChartOptions} />
                </div>
                <Row className="mt-4">
                  <Col md={6}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <h6>💡 Focus on Calculus Integration</h6>
                        <small className="text-muted">23% performance, 10% weightage</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <h6>💪 Strong in Coordinate Geometry</h6>
                        <small className="text-muted">93% performance, 8% weightage</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Mistake Analysis Tab */}
          <Tab.Pane eventKey="mistakes">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-4">
                  <FontAwesomeIcon icon={faBullseye} className="me-2 text-info" />
                  Mistake-Progress-Analysis
                </h5>
                <Row>
                  <Col md={6}>
                    <div style={{ height: "350px" }}>
                      <Doughnut data={mistakeData} options={doughnutOptions} />
                    </div>
                    <div className="text-center mt-3">
                      <p className="text-muted">
                        Total: <strong>150</strong> Questions
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mt-4">
                      <h6 className="mb-3">📊 Priority Chapters (Based on NCERT Weightage)</h6>
                      <Row className="g-3">
                        <Col xs={12}>
                          <Card className="border-0 bg-danger bg-opacity-10">
                            <Card.Body>
                              <h6 className="text-danger mb-2">🔴 HIGH PRIORITY</h6>
                              <p className="mb-1 fw-bold">Calculus - Integration</p>
                              <small className="text-muted">23% performance, 10% weightage</small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col xs={12}>
                          <Card className="border-0 bg-warning bg-opacity-10">
                            <Card.Body>
                              <h6 className="text-warning mb-2">⚠ MEDIUM PRIORITY</h6>
                              <p className="mb-1 fw-bold">Quadratic Applications</p>
                              <small className="text-muted">83% performance, 12% weightage</small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col xs={12}>
                          <Card className="border-0 bg-success bg-opacity-10">
                            <Card.Body>
                              <h6 className="text-success mb-2">✅ MAINTAIN</h6>
                              <p className="mb-1 fw-bold">Trigonometry</p>
                              <small className="text-muted">93% performance, 10% weightage</small>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                </Row>
                
                {/* Filtered Results Section */}
                <div className="mt-5">
                  <h6 className="mb-3">
                    <FontAwesomeIcon icon={faFilter} className="me-2" />
                    Explore Your Questions In Different Ways
                  </h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>📊 Filter By Performance Percentage</Form.Label>
                        <Form.Select value={performanceFilter} onChange={(e) => setPerformanceFilter(e.target.value)}>
                          <option value="all">All Percentages</option>
                          <option value="90-100">90-100%</option>
                          <option value="80-90">80-90%</option>
                          <option value="70-80">70-80%</option>
                          <option value="below70">Below 70%</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>📚 Filter By Chapter</Form.Label>
                        <Form.Select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}>
                          <option value="all">All Chapters</option>
                          <option value="algebra">Algebra</option>
                          <option value="trigonometry">Trigonometry</option>
                          <option value="calculus">Calculus</option>
                          <option value="geometry">Geometry</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
            
            {/* Filtered Results Table */}
            <Card className="mt-4 border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h6 className="mb-0">📋 Filtered Results - 20 Questions Found</h6>
                <small className="text-muted">Showing questions based on your selected filters</small>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: '5%' }}>Question ID</th>
                        <th style={{ width: '15%' }}>Chapter</th>
                        <th style={{ width: '8%' }}>Date</th>
                        <th style={{ width: '20%' }}>Question</th>
                        <th style={{ width: '8%' }}>My Score</th>
                        <th style={{ width: '10%' }}>Performance</th>
                        <th style={{ width: '8%' }}>Mistake Tracker</th>
                        <th style={{ width: '10%' }}>Current Status</th>
                        <th style={{ width: '16%' }}>Student Mistake</th>
                        <th style={{ width: '15%' }}>Correct Approach</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((result) => (
                        <tr key={result.id}>
                          <td className="fw-bold text-primary">{result.id}</td>
                          <td><small>{result.chapter}</small></td>
                          <td><small>{result.date}</small></td>
                          <td><small>{result.question}</small></td>
                          <td><strong>{result.score}</strong></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <ProgressBar 
                                now={result.performance} 
                                variant={result.performance >= 80 ? 'success' : result.performance >= 60 ? 'warning' : 'danger'}
                                style={{ width: '60px', height: '6px' }} 
                                className="me-2"
                              />
                              <small>{result.performance}%</small>
                            </div>
                          </td>
                          <td><small className="text-muted">First submission, no prior mistakes</small></td>
                          <td>
                            <span className={`badge bg-${result.status === 'CORRECT' ? 'success' : 'warning'}`}>
                              {result.status}
                            </span>
                          </td>
                          <td><small className="text-danger">{result.studentMistake}</small></td>
                          <td><small className="text-success">{result.approach}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Showing 1-11 of 20 results</small>
                  <div>
                    <Button size="sm" variant="outline-primary" className="me-2">Previous</Button>
                    <Button size="sm" variant="outline-primary">Next</Button>
                  </div>
                </div>
              </Card.Footer>
            </Card>
          </Tab.Pane>

          {/* Summary Tab */}
          <Tab.Pane eventKey="summary">
            <div className="mb-4">
              <h5 className="mb-3">📊 Student Performance Summary</h5>
              <div className="d-flex gap-2 mb-3">
                <Button 
                  variant={viewMode === 'all' ? 'success' : 'outline-success'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                >
                  ✅ All Data
                </Button>
                <Button 
                  variant={viewMode === 'homework' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('homework')}
                >
                  📘 Homework
                </Button>
                <Button 
                  variant={viewMode === 'classwork' ? 'secondary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('classwork')}
                >
                  📗 Classwork
                </Button>
              </div>
              
              {/* Performance Statistics Cards */}
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <h2 className="text-primary mb-0">{summaryStats.assessments}</h2>
                      <small className="text-muted text-uppercase">Assessments</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <h2 className="text-info mb-0">{summaryStats.chapters}</h2>
                      <small className="text-muted text-uppercase">Chapters</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <h2 className="text-success mb-0">{summaryStats.questions}</h2>
                      <small className="text-muted text-uppercase">Questions</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <h2 className="text-warning mb-0">{summaryStats.accuracy}%</h2>
                      <small className="text-muted text-uppercase">Accuracy</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                {/* Overall Performance Card */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h6 className="text-muted mb-3">
                        <FontAwesomeIcon icon={faChartLine} className="me-2 text-primary" />
                        Overall Performance
                      </h6>
                      <div className="text-center mb-4">
                        <h1 className="text-primary display-3">59%</h1>
                        <p className="text-muted">Focus on homework completion to improve understanding</p>
                      </div>
                      <Row className="text-center">
                        <Col xs={6}>
                          <div>
                            <p className="mb-1 text-muted">Homework Avg:</p>
                            <h4>{summaryStats.homeworkAvg}%</h4>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div>
                            <p className="mb-1 text-muted">Classwork Avg:</p>
                            <h4>{summaryStats.classworkAvg}%</h4>
                          </div>
                        </Col>
                      </Row>
                      <hr />
                      <Row className="text-center">
                        <Col xs={6}>
                          <div>
                            <p className="mb-1 text-muted">Performance Gap:</p>
                            <h5 className="text-danger">{summaryStats.performanceGap}%</h5>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div>
                            <p className="mb-1 text-muted">Improvement Rate:</p>
                            <h5 className="text-success">+{summaryStats.improvementRate}%</h5>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Priority Chapters Card */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h6 className="text-muted mb-3">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2 text-warning" />
                        Priority Chapters (NCERT Weightage)
                      </h6>
                      
                      <div className="mb-4">
                        <Card className="border-0 bg-danger bg-opacity-10 mb-3">
                          <Card.Body className="py-3">
                            <h6 className="text-danger mb-2">🔴 HIGH PRIORITY</h6>
                            <p className="mb-1 fw-bold">Calculus - Integration</p>
                            <small className="text-muted">23% performance • 10% weightage</small>
                          </Card.Body>
                        </Card>

                        <Card className="border-0 bg-warning bg-opacity-10 mb-3">
                          <Card.Body className="py-3">
                            <h6 className="text-warning mb-2">⚠ MEDIUM PRIORITY</h6>
                            <p className="mb-1 fw-bold">Quadratic Applications</p>
                            <small className="text-muted">83% performance • 12% weightage</small>
                          </Card.Body>
                        </Card>

                        <Card className="border-0 bg-success bg-opacity-10">
                          <Card.Body className="py-3">
                            <h6 className="text-success mb-2">✅ MAINTAIN PRIORITY</h6>
                            <p className="mb-1 fw-bold">Trigonometry</p>
                            <small className="text-muted">93% performance • 10% weightage</small>
                          </Card.Body>
                        </Card>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Recommendations */}
              <Card className="mt-4 border-0 shadow-sm">
                <Card.Body>
                  <h6 className="mb-3">
                    <FontAwesomeIcon icon={faLightbulb} className="me-2 text-warning" />
                    Recommendations
                  </h6>
                  <Row>
                    <Col md={6}>
                      <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                        <FontAwesomeIcon icon={faBook} className="text-primary me-3" size="2x" />
                        <div>
                          <h6 className="mb-1">Review fundamental concepts thoroughly</h6>
                          <small className="text-muted">Focus on understanding basic principles before solving complex problems</small>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-success me-3" size="2x" />
                        <div>
                          <h6 className="mb-1">Continue regular practice to maintain momentum</h6>
                          <small className="text-muted">Your improvement trend shows consistent progress</small>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default StudentAnalytics;