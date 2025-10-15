import React, { useContext, useState, useMemo } from 'react';
import { Card, Row, Col, Button, Modal } from 'react-bootstrap';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { ProgressContext } from '../contexts/ProgressContext';
import StudyStreak from './StudyStreak';
import SubjectProgress from './SubjectProgress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAlert } from './AlertBox';
import { 
  faTrophy, 
  faChartLine, 
  faAward, 
  faGift,
  faClock,
  faQuestionCircle 
} from '@fortawesome/free-solid-svg-icons';

const ProgressDashboard = () => {
  const { showAlert, AlertContainer } = useAlert();
  const { 
    getProgressSummary, 
    redeemReward,
    getWeeklyStudyData
  } = useContext(ProgressContext);

  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState('questions'); // 'questions' or 'time'
  
  // Get progress data with all study time stats
  const progressData = getProgressSummary() || {
    streak: 0,
    longestStreak: 0,
    totalStudyDays: 0,
    weeklySummary: { dailyLogs: {} },
    points: 0,
    badges: [],
    totalQuestions: 0,
    correctQuestions: 0,
    accuracy: 0,
    totalStudyTime: 0,
    dailyStudyTime: 0,
    weeklyStudyData: []
  };

  // Get weekly study data for charts
  const weeklyStudyData = useMemo(() => {
    // Find most recent week data
    const recentWeeks = progressData.weeklyStudyData || [];
    const mostRecentWeek = recentWeeks.length > 0 
      ? recentWeeks[recentWeeks.length - 1] 
      : { dailyData: [] };
      
    // Format for chart display
    return mostRecentWeek.dailyData || [];
  }, [progressData.weeklyStudyData]);

  // Format day names for better display
  const formatDayName = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Prepare data for chart
  const chartData = useMemo(() => {
    return weeklyStudyData.map(day => ({
      ...day,
      dayName: formatDayName(day.date),
      date: day.date,
      studyTime: day.studyTime || 0,
      questionsAttempted: day.questionsAttempted || 0
    }));
  }, [weeklyStudyData]);

  // Rewards section
  const availableRewards = [
    { 
      name: 'Extra Practice Session', 
      cost: 100, 
      description: 'Unlock additional practice questions',
      icon: faChartLine
    },
    { 
      name: 'Hint Token', 
      cost: 50, 
      description: 'Get a helpful hint for challenging questions',
      icon: faAward
    },
    { 
      name: 'Bonus Question', 
      cost: 75, 
      description: 'Earn an extra challenge question',
      icon: faTrophy
    }
  ];

  // Handle reward redemption
  const handleRedeemReward = (rewardName) => {
    try {
      const redeemedReward = redeemReward(rewardName);
      if (redeemedReward) {
        showAlert(`Successfully redeemed: ${redeemedReward.name}`, "success");
        setShowRedeemModal(false);
      }
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <>
      <AlertContainer />
      <div className="progress-page-container">
      {/* Study Streak Section */}
      <div className="streak-card">
        <StudyStreak />
      </div>

      {/* Performance Overview */}
      <div className="performance-card">
        <Card className="h-100">
          <Card.Header>
            <h5 className="mb-0">Performance Overview</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <div className="text-center mb-3">
                  <h5>Accuracy</h5>
                  <h3 className="text-primary">
                    {progressData.accuracy.toFixed(2)}%
                  </h3>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center mb-3">
                  <h5>Total Questions</h5>
                  <h3 className="text-success">
                    {progressData.totalQuestions}
                  </h3>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center mb-3">
                  <h5>Study Time</h5>
                  <h3 className="text-info">
                    {progressData.totalStudyTime} mins
                  </h3>
                </div>
              </Col>
            </Row>
            <div className="progress-details text-muted">
              <div className="d-flex justify-content-between">
                <small>
                  Correct Answers: {progressData.correctQuestions}
                </small>
                <small>
                  Today's Study Time: {progressData.dailyStudyTime} mins
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Weekly Progress */}
      <div className="weekly-progress-card">
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Weekly Study Progress</h5>
            <div className="btn-group">
              <Button 
                variant={activeChartTab === 'questions' ? 'primary' : 'outline-primary'} 
                size="sm"
                onClick={() => setActiveChartTab('questions')}
              >
                <FontAwesomeIcon icon={faQuestionCircle} className="me-2" />
                Questions
              </Button>
              <Button 
                variant={activeChartTab === 'time' ? 'primary' : 'outline-primary'} 
                size="sm"
                onClick={() => setActiveChartTab('time')}
              >
                <FontAwesomeIcon icon={faClock} className="me-2" />
                Study Time
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              {activeChartTab === 'questions' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="questionsAttempted" 
                    name="Questions Attempted" 
                    fill="#82ca9d" 
                  />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="studyTime" 
                    stroke="#8884d8" 
                    name="Study Time (mins)" 
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      </div>

      {/* Subject Progress */}
      <div className="subject-progress-section">
        <SubjectProgress />
      </div>

      {/* Badges and Rewards */}
      <div className="row">
        {/* Badges Section */}
        <div className="col-md-8">
          <div className="badges-section">
            <Card>
              <Card.Header>Earned Badges</Card.Header>
              <Card.Body>
                <div className="d-flex flex-wrap justify-content-center">
                  {progressData.badges.length > 0 ? (
                    progressData.badges.map((badge, index) => (
                      <div 
                        key={index} 
                        className="badge-item text-center m-2"
                        style={{ width: '120px' }}
                      >
                        <div 
                          className="badge-icon" 
                          style={{ 
                            fontSize: '3rem', 
                            color: badge.type === 'gold' ? '#FFD700' : 
                                   badge.type === 'silver' ? '#C0C0C0' : '#CD7F32'
                          }}
                        >
                          🏆
                        </div>
                        <p>{badge.name}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center w-100">No badges earned yet</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="col-md-4">
          <div className="rewards-section">
            <Card>
              <Card.Header>
                <FontAwesomeIcon icon={faGift} className="me-2" />
                Rewards
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h3 className="rewards-title">
                      <span role="img" aria-label="gift">🎁</span> Points
                    </h3>
                    <div className="points-display">{progressData.points} Points</div>
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="redeem-button"
                    onClick={() => setShowRedeemModal(true)}
                  >
                    Redeem Rewards
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Reward Redemption Modal */}
      <Modal show={showRedeemModal} onHide={() => setShowRedeemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Redeem Rewards</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {availableRewards.map((reward, index) => (
              <Col key={index} md={4} className="text-center mb-3">
                <Card className="h-100">
                  <Card.Body className="d-flex flex-column">
                    <FontAwesomeIcon 
                      icon={reward.icon} 
                      className="mb-3 text-primary" 
                      size="2x" 
                    />
                    <h5>{reward.name}</h5>
                    <p className="text-muted small">{reward.description}</p>
                    <p className="font-weight-bold">{reward.cost} Points</p>
                    <Button 
                      variant="outline-primary" 
                      className="mt-auto"
                      disabled={progressData.points < reward.cost}
                      onClick={() => handleRedeemReward(reward.name)}
                    >
                      Redeem
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>
    </div>
    </>
  );
};

export default ProgressDashboard;