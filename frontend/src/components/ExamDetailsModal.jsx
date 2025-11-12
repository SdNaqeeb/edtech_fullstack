// src/components/ExamDetailsModal.jsx - FINAL FIXED VERSION with concept object handling
import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, ProgressBar, Alert, Spinner, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faGraduationCap,
  faChartLine,
  faCheckCircle,
  faExclamationTriangle,
  faLightbulb,
  faTrophy,
  faChartBar,
  faClipboardCheck,
  faFileAlt,
  faBullseye,
  faArrowUp,
  faArrowDown,
  faEye,
  faDownload,
  faExpand,
  faCompress
} from '@fortawesome/free-solid-svg-icons';
import MarkdownWithMath from './MarkdownWithMath';
import axiosInstance from '../api/axiosInstance';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ExamDetailsModal.css';

const ExamDetailsModal = ({ show, onHide, result }) => {
  // State for questions evaluation
  const [questionsEvaluation, setQuestionsEvaluation] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Default to fullscreen

  // Auto-load questions when modal opens
useEffect(() => {
  if (show && result && !questionsEvaluation && !loadingQuestions) {
    fetchQuestionsEvaluation();
  }
}, [show, result]);

  // Reset questions state when modal is closed or exam changes
  useEffect(() => {
    if (!show) {
      setQuestionsEvaluation(null);
      setShowQuestions(false);
      setQuestionsError(null);
      setLoadingQuestions(false);
    }
  }, [show]);

  useEffect(() => {
    setQuestionsEvaluation(null);
    setShowQuestions(false);
    setQuestionsError(null);
    setLoadingQuestions(false);
  }, [result?.result_id, result?.student_id, result?.id]);

  // Helper function to extract concept name from string or object
  const getConceptName = (concept) => {
    if (typeof concept === 'string') {
      return concept;
    }
    if (typeof concept === 'object' && concept !== null) {
      return concept.concept_name || concept.name || String(concept);
    }
    return String(concept);
  };

  // Helper function to get concept description
  const getConceptDescription = (concept) => {
    if (typeof concept === 'object' && concept !== null) {
      return concept.concept_description || concept.description || null;
    }
    return null;
  };

  // Helper functions
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': case 'A+': return 'success';
      case 'B': case 'B+': return 'info';
      case 'C': case 'C+': return 'warning';
      case 'D': return 'danger';
      case 'F': return 'danger';
      default: return 'secondary';
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { label: 'Outstanding', color: 'success', icon: faTrophy };
    if (percentage >= 80) return { label: 'Excellent', color: 'success', icon: faCheckCircle };
    if (percentage >= 70) return { label: 'Very Good', color: 'info', icon: faArrowUp };
    if (percentage >= 60) return { label: 'Good', color: 'info', icon: faCheckCircle };
    if (percentage >= 50) return { label: 'Average', color: 'warning', icon: faChartBar };
    if (percentage >= 40) return { label: 'Below Average', color: 'warning', icon: faArrowDown };
    return { label: 'Needs Improvement', color: 'danger', icon: faExclamationTriangle };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const percentage = result?.overall_percentage || 0;
  const performance = getPerformanceLevel(percentage);

  const parseListData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return data.split(',').map(s => s.trim()).filter(s => s);
    return [];
  };

  const strengths = parseListData(result?.strengths);
  const improvements = parseListData(result?.areas_for_improvement);

  // Fetch questions evaluation
  const fetchQuestionsEvaluation = async () => {
    const studentResultId = result?.student_id || result?.result_id || result?.id;

    if (!studentResultId) {
      setQuestionsError('Student result ID not available');
      return;
    }

    try {
      setLoadingQuestions(true);
      setQuestionsError(null);

      const response = await axiosInstance.get('/questions-evaluated/', {
        params: {
          student_result_id: studentResultId
        }
      });

      console.log('API Response:', response.data);

      if (response.data) {
        // Handle the nested structure correctly
        let data = response.data;
        
        // If it's wrapped in question_data array
        if (data.question_data && Array.isArray(data.question_data)) {
          data = data.question_data[0];
        }
        
        console.log('Processed data:', data);
        
        setQuestionsEvaluation(data);
        setShowQuestions(true);
      }
    } catch (error) {
      console.error('Error fetching questions evaluation:', error);
      setQuestionsError(error.response?.data?.error || 'Failed to fetch questions evaluation');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

 const downloadPDF = () => {
  // LaTeX to readable text converter
  const convertLatexToText = (text) => {
    if (!text) return '';
    
    let converted = text;
    
    // Remove LaTeX delimiters
    converted = converted.replace(/\$\$/g, '');
    converted = converted.replace(/\$/g, '');
    
    // Convert common LaTeX commands to Unicode/text
    const replacements = {
      // Superscripts
      '\\^\\{0\\}': '⁰', '\\^0': '⁰',
      '\\^\\{1\\}': '¹', '\\^1': '¹',
      '\\^\\{2\\}': '²', '\\^2': '²',
      '\\^\\{3\\}': '³', '\\^3': '³',
      '\\^\\{4\\}': '⁴', '\\^4': '⁴',
      '\\^\\{5\\}': '⁵', '\\^5': '⁵',
      '\\^\\{6\\}': '⁶', '\\^6': '⁶',
      '\\^\\{7\\}': '⁷', '\\^7': '⁷',
      '\\^\\{8\\}': '⁸', '\\^8': '⁸',
      '\\^\\{9\\}': '⁹', '\\^9': '⁹',
      
      // Greek letters
      '\\\\alpha': 'α',
      '\\\\beta': 'β',
      '\\\\gamma': 'γ',
      '\\\\delta': 'δ',
      '\\\\epsilon': 'ε',
      '\\\\theta': 'θ',
      '\\\\pi': 'π',
      '\\\\sigma': 'σ',
      '\\\\omega': 'ω',
      
      // Math symbols
      '\\\\angle': '∠',
      '\\\\circ': '°',
      '\\\\times': '×',
      '\\\\div': '÷',
      '\\\\pm': '±',
      '\\\\neq': '≠',
      '\\\\leq': '≤',
      '\\\\geq': '≥',
      '\\\\approx': '≈',
      '\\\\infty': '∞',
      '\\\\sum': '∑',
      '\\\\sqrt': '√',
      '\\\\perp': '⊥',
      '\\\\parallel': '∥',
      '\\\\mathrm': '',
      
      // Fractions - convert to division
      '\\\\frac': '',
      
      // Remove curly braces
      '\\{': '(',
      '\\}': ')',
      
      // Remove backslashes
      '\\\\': ''
    };
    
    // Apply replacements
    for (const [pattern, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(pattern, 'g');
      converted = converted.replace(regex, replacement);
    }
    
    // Handle fractions like \frac{a}{b} -> (a/b)
    converted = converted.replace(/frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');
    
    // Clean up remaining braces
    converted = converted.replace(/[{}]/g, '');
    
    // Remove HTML tags
    converted = converted.replace(/<[^>]*>/g, '');
    
    // Clean up extra spaces
    converted = converted.replace(/\s+/g, ' ').trim();
    
    return converted;
  };

  // Calculate performanceLevel before using it
  const percentage = result?.total_max_marks > 0
    ? ((result.total_marks_obtained / result.total_max_marks) * 100)
    : 0;
  
  let performanceLevel = '';
  if (percentage >= 90) {
    performanceLevel = 'Excellent';
  } else if (percentage >= 75) {
    performanceLevel = 'Very Good';
  } else if (percentage >= 60) {
    performanceLevel = 'Good';
  } else if (percentage >= 50) {
    performanceLevel = 'Average';
  } else if (percentage >= 40) {
    performanceLevel = 'Below Average';
  } else {
    performanceLevel = 'Needs Improvement';
  }
  
  const parseListData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      return data.split(',').map(s => s.trim()).filter(s => s);
    }
    return [];
  };
  
  // Helper to extract concept name
  const getConceptName = (concept) => {
    if (typeof concept === 'string') return concept;
    if (typeof concept === 'object' && concept !== null) {
      return concept.concept_name || concept.name || String(concept);
    }
    return String(concept);
  };
  
  const strengths = parseListData(result?.strengths);
  const improvements = parseListData(result?.areas_for_improvement);
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  const checkPageBreak = (requiredSpace) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // ========== HEADER ==========
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Exam Details Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(result?.exam_name || 'Exam', pageWidth / 2, 30, { align: 'center' });
  
  yPosition = 50;

  // ========== EXAM OVERVIEW ========== (FIXED: No special characters)
  checkPageBreak(30);
  
  doc.setFillColor(249, 250, 251);
  doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Exam Overview', 15, yPosition + 6); // REMOVED emoji icons
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const overviewData = [
    ['Exam Type:', result?.exam_type || 'N/A'],
    ['Class/Section:', result?.class_section || 'N/A'],
    ['Score:', `${result?.total_marks_obtained || 0} / ${result?.total_max_marks || 0}`],
    ['Percentage:', `${percentage.toFixed(1)}%`],
    ['Performance:', performanceLevel]
  ];
  
  overviewData.forEach(([label, value]) => {
    checkPageBreak(8);
    doc.text(label, 20, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 80, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 7;
  });
  
  yPosition += 5;

  // ========== STRENGTHS ==========
  if (strengths.length > 0) {
    checkPageBreak(30);
    
    doc.setFillColor(209, 250, 229);
    doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text('Strengths', 15, yPosition + 6); // REMOVED emoji
    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    strengths.forEach((strength) => {
      const lines = doc.splitTextToSize(`• ${strength}`, pageWidth - 40);
      lines.forEach(line => {
        checkPageBreak(8);
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    });
    yPosition += 5;
  }

  // ========== AREAS FOR IMPROVEMENT ==========
  if (improvements.length > 0) {
    checkPageBreak(30);
    
    doc.setFillColor(255, 243, 205);
    doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text('Areas for Improvement', 15, yPosition + 6); // REMOVED emoji
    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    improvements.forEach((improvement) => {
      const lines = doc.splitTextToSize(`• ${improvement}`, pageWidth - 40);
      lines.forEach(line => {
        checkPageBreak(8);
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    });
    yPosition += 10;
  }

  // ========== QUESTIONS SUMMARY TABLE ========== (FIXED: No special characters)
  if (questionsEvaluation?.questions_evaluation?.length > 0) {
    checkPageBreak(40);
    
    doc.setFillColor(220, 240, 255);
    doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 110, 253);
    doc.text('Questions Summary', 15, yPosition + 6); // REMOVED emoji
    yPosition += 15;

    const tableData = questionsEvaluation.questions_evaluation.map((q, index) => [
      q.question_number || `Q${index + 1}`,
      `${q.total_score || 0}`,
      `${q.max_marks || 0}`,
      `${q.percentage?.toFixed(1) || 0}%`,
      q.error_type === 'no_error' ? 'Pass' : 'Fail'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Question', 'Scored', 'Total', 'Percentage', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 40 },
        4: { halign: 'center', cellWidth: 30 }
      }
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // ========== DETAILED QUESTIONS EVALUATION ==========
  if (questionsEvaluation?.questions_evaluation?.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(102, 126, 234);
    doc.rect(10, yPosition, pageWidth - 20, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Detailed Questions Evaluation', 15, yPosition + 7); // REMOVED emoji
    yPosition += 20;

    questionsEvaluation.questions_evaluation.forEach((question, index) => {
      checkPageBreak(80); // More space for detailed sections
      
      const qPercentage = question.percentage || 0;
      let statusColor, statusText;
      
      if (qPercentage === 100) {
        statusColor = [16, 185, 129];
        statusText = 'Correct';
      } else if (qPercentage === 0) {
        statusColor = [239, 68, 68];
        statusText = 'Incorrect';
      } else {
        statusColor = [245, 158, 11];
        statusText = 'Partially Correct';
      }
      
      // Question Header Box
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(10, yPosition, pageWidth - 20, 20, 3, 3, 'FD');
      
      // Question Number Circle
      doc.setFillColor(102, 126, 234);
      doc.circle(20, yPosition + 10, 6, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${question.question_number || index + 1}`, 20, yPosition + 12, { align: 'center' });
      
      // Status Badge
      doc.setFillColor(...statusColor);
      doc.roundedRect(35, yPosition + 5, 40, 10, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(statusText, 37, yPosition + 12);
      
      // Score
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Score: ${question.total_score || 0}/${question.max_marks || 0}`, pageWidth - 50, yPosition + 10);
      
      // Percentage
      doc.setFontSize(10);
      doc.setTextColor(...statusColor);
      doc.text(`${qPercentage.toFixed(1)}%`, pageWidth - 50, yPosition + 16);
      
      yPosition += 25;
      
      // Question Text (FIXED: LaTeX conversion)
      checkPageBreak(30);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Question:', 15, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      const questionText = question.question || 'N/A';
      const cleanQuestionText = convertLatexToText(questionText); // LATEX CONVERSION
      const questionLines = doc.splitTextToSize(cleanQuestionText, pageWidth - 30);
      
      questionLines.forEach(line => {
        checkPageBreak(8);
        doc.text(line, 15, yPosition);
        yPosition += 5;
      });
      
      yPosition += 3;
      
      // Concepts Required (FIXED: Extract concept names properly)
      if (question.concepts_required && question.concepts_required.length > 0) {
        checkPageBreak(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Concepts Required:', 15, yPosition);
        yPosition += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        question.concepts_required.forEach(concept => {
          checkPageBreak(6);
          const conceptName = getConceptName(concept); // EXTRACT NAME
          doc.text(`• ${conceptName}`, 20, yPosition);
          yPosition += 5;
        });
      }
      
      yPosition += 5;
      
      // MISTAKES MADE SECTION (NEW)
      if (question.mistakes_made && question.mistakes_made !== 'None') {
        checkPageBreak(25);
        
        doc.setFillColor(254, 226, 226);
        doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text('Mistakes Made:', 15, yPosition + 6);
        yPosition += 12;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        const mistakesText = convertLatexToText(question.mistakes_made);
        const mistakesLines = doc.splitTextToSize(mistakesText, pageWidth - 40);
        
        mistakesLines.forEach(line => {
          checkPageBreak(6);
          doc.text(line, 20, yPosition);
          yPosition += 5;
        });
        
        yPosition += 5;
      }
      
      // GAP ANALYSIS SECTION (NEW)
      if (question.gap_analysis && question.gap_analysis !== 'No gaps identified') {
        checkPageBreak(25);
        
        doc.setFillColor(254, 243, 199);
        doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 158, 11);
        doc.text('Gap Analysis:', 15, yPosition + 6);
        yPosition += 12;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        const gapText = convertLatexToText(question.gap_analysis);
        const gapLines = doc.splitTextToSize(gapText, pageWidth - 40);
        
        gapLines.forEach(line => {
          checkPageBreak(6);
          doc.text(line, 20, yPosition);
          yPosition += 5;
        });
        
        yPosition += 5;
      }
      
      yPosition += 5;
      
      // Separator line
      if (index < questionsEvaluation.questions_evaluation.length - 1) {
        doc.setDrawColor(229, 231, 235);
        doc.line(10, yPosition, pageWidth - 10, yPosition);
        yPosition += 10;
      }
    });
  }

  // ========== FOOTER ON ALL PAGES ==========
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `${result?.exam_name?.replace(/[^a-z0-9]/gi, '_') || 'Exam'}_Details_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

  return (
    <Modal 
  show={show} 
  onHide={onHide} 
  size="xl" 
  fullscreen={isFullscreen}
  scrollable 
  centered={!isFullscreen}
  className={`exam-details-modal ${showQuestions ? 'questions-loaded' : ''}`}
>
      <Modal.Header closeButton className="exam-modal-header">
        <Modal.Title className="exam-modal-title">
          <FontAwesomeIcon icon={faFileAlt} className="me-3" />
          Exam Details - {result?.exam_name || result?.exam || 'N/A'}
        </Modal.Title>
        <Button 
          variant="link" 
          onClick={toggleFullscreen}
          className="fullscreen-toggle"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
        </Button>
      </Modal.Header>

      <Modal.Body className="exam-modal-body">
        {/* Exam Overview */}
        <div className="exam-overview-card">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="info-item">
                <FontAwesomeIcon icon={faFileAlt} className="info-icon text-primary" />
                <div className="info-content">
                  <span className="info-label">Exam Type</span>
                  <Badge bg="secondary" className="info-badge">{result?.exam_type || 'N/A'}</Badge>
                </div>
              </div>
              <div className="info-item">
                <FontAwesomeIcon icon={faGraduationCap} className="info-icon text-info" />
                <div className="info-content">
                  <span className="info-label">Class/Section</span>
                  <span className="info-value">{result?.class_section || 'N/A'}</span>
                </div>
              </div>
              {result?.roll_number && (
                <div className="info-item">
                  <FontAwesomeIcon icon={faClipboardCheck} className="info-icon text-success" />
                  <div className="info-content">
                    <span className="info-label">Roll Number</span>
                    <span className="info-value">{result.roll_number}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-6">
              <div className="info-item">
                <FontAwesomeIcon icon={faChartLine} className="info-icon text-primary" />
                <div className="info-content">
                  <span className="info-label">Score</span>
                  <span className="info-value score-highlight">
                    {result?.total_marks_obtained || 0} / {result?.total_marks || 0}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <FontAwesomeIcon icon={faBullseye} className="info-icon text-warning" />
                <div className="info-content">
                  <span className="info-label">Percentage</span>
                  <span className={`info-value percentage-${getPercentageColor(percentage)}`}>
                    {percentage.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="info-item">
                <FontAwesomeIcon icon={performance.icon} className={`info-icon text-${performance.color}`} />
                <div className="info-content">
                  <span className="info-label">Performance</span>
                  <Badge bg={performance.color} className="performance-badge">{performance.label}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Performance Progress */}
          <div className="performance-progress-section">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Overall Performance</h6>
              <span className="percentage-display">{percentage.toFixed(1)}%</span>
            </div>
            <ProgressBar 
              now={percentage} 
              variant={getPercentageColor(percentage)}
              className="performance-progress-bar"
              animated
            />
          </div>
        </div>

        {/* Strengths and Areas for Improvement */}
        {(strengths.length > 0 || improvements.length > 0) && (
          <div className="row g-3 mb-4">
            {strengths.length > 0 && (
              <div className="col-md-6">
                <div className="strengths-card">
                  <h5 className="section-heading">
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Strengths
                  </h5>
                  <ul className="strengths-list">
                    {strengths.map((strength, index) => (
                      <li key={index} className="strength-item">
                        <FontAwesomeIcon icon={faCheckCircle} className="bullet-icon" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {improvements.length > 0 && (
              <div className="col-md-6">
                <div className="improvements-card">
                  <h5 className="section-heading">
                    <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                    Areas for Improvement
                  </h5>
                  <ul className="improvements-list">
                    {improvements.map((improvement, index) => (
                      <li key={index} className="improvement-item">
                        <FontAwesomeIcon icon={faLightbulb} className="bullet-icon" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions Summary Table - FIXED FIELD MAPPING */}
        {showQuestions && questionsEvaluation?.questions_evaluation?.length > 0 && (
          <div className="questions-summary-section mb-4">
            <h5 className="section-heading mb-3">
              <FontAwesomeIcon icon={faChartBar} className="me-2" />
              Questions Summary
            </h5>
            <div className="table-responsive">
              <Table bordered hover className="questions-summary-table">
                <thead>
                  <tr>
                    <th className="text-center">Question No.</th>
                    <th className="text-center">Marks Obtained</th>
                    <th className="text-center">Total Marks</th>
                    <th className="text-center">Percentage</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsEvaluation.questions_evaluation.map((question, index) => {
                    // FIXED: Use correct field names from API
                    const marksObtained = question.total_score || 0;
                    const maxMarks = question.max_marks || 0;
                    const qPercentage = question.percentage || 0;
                    const statusClass = qPercentage >= 75 ? 'success' : qPercentage >= 50 ? 'warning' : 'danger';
                    
                    return (
                      <tr key={index}>
                        <td className="text-center fw-bold">{question.question_number || `Q${index + 1}`}</td>
                        <td className="text-center">{marksObtained}</td>
                        <td className="text-center">{maxMarks}</td>
                        <td className="text-center">
                          <Badge bg={getPercentageColor(qPercentage)}>
                            {qPercentage.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg={statusClass}>
                            {question.error_type === 'no_error' ? 'Pass' : 'Fail'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {/* Detailed Questions Evaluation - FIXED FIELD MAPPING AND CONCEPT HANDLING */}
        {showQuestions && questionsEvaluation && (
          <div className="detailed-questions-section">
            <h5 className="section-heading mb-3">
              <FontAwesomeIcon icon={faEye} className="me-2" />
              Detailed Questions Evaluation
            </h5>

            {questionsEvaluation.questions_evaluation && questionsEvaluation.questions_evaluation.length > 0 ? (
              questionsEvaluation.questions_evaluation.map((question, index) => {
                // FIXED: Use correct field names
                const marksObtained = question.total_score || 0;
                const maxMarks = question.max_marks || 0;
                const qPercentage = question.percentage || 0;
                
                return (
                  <div key={index} className="question-card">
                    {/* Enhanced Question Header */}
                    <div className={`question-header bg-gradient-${getPercentageColor(qPercentage)}`}>
                      <div className="question-header-left">
                        <div className="question-number-badge">
                          <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
                          {question.question_number || `Q${index + 1}`}
                        </div>
                        <div className="question-status-indicator">
                          {question.error_type === 'no_error' ? (
                            <Badge bg="success" className="status-badge">
                              <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge bg="danger" className="status-badge">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                              {question.error_type || 'Error'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="question-header-right">
                        <div className="score-display-enhanced">
                          <div className="marks-obtained">
                            <span className="marks-value">{marksObtained}</span>
                            <span className="marks-separator">/</span>
                            <span className="marks-total">{maxMarks}</span>
                          </div>
                          <div className="marks-label">marks</div>
                        </div>
                        <div className="percentage-display-enhanced">
                          <div className="percentage-circle" style={{'--percentage': `${qPercentage}%`}}>
                            <span className="percentage-value">{qPercentage.toFixed(0)}</span>
                            <span className="percentage-symbol">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="question-body">
                      {/* Question Text */}
                      <div className="question-section">
                        <div className="section-header-inline">
                          <FontAwesomeIcon icon={faBullseye} className="section-icon" />
                          <strong>Question:</strong>
                        </div>
                        <div className="question-text-content">
                          <MarkdownWithMath content={question.question || 'Question not available'} />
                        </div>
                      </div>

                      {/* Concepts Required - FIXED TO HANDLE OBJECTS */}
                      {question.concepts_required && question.concepts_required.length > 0 && (
                        <div className="concepts-section">
                          <div className="section-header-inline">
                            <FontAwesomeIcon icon={faLightbulb} className="section-icon text-warning" />
                            <strong>Concepts Required:</strong>
                          </div>
                          <div className="concepts-badges">
                            {question.concepts_required.map((concept, idx) => {
                              const conceptName = getConceptName(concept);
                              const conceptDescription = getConceptDescription(concept);

                              return (
                                <div key={idx} className="concept-item">
                                  <Badge bg="info" className="concept-badge">
                                    {conceptName}
                                  </Badge>
                                  {conceptDescription && (
                                    <div className="concept-description">
                                      <MarkdownWithMath content={conceptDescription} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mistakes and Gap Analysis */}
                      <div className="row g-3">
                        {question.mistakes_made && question.mistakes_made !== 'None' && (
                          <div className="col-md-6">
                            <Alert variant="danger" className="mistakes-alert">
                              <div className="alert-header">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                <strong>Mistakes Made:</strong>
                              </div>
                              <div className="alert-content">
                                <MarkdownWithMath content={question.mistakes_made} />
                              </div>
                              {question.mistake_section && question.mistake_section !== 'N/A' && (
                                <div className="mistake-section-tag">
                                  <small>Section: {question.mistake_section}</small>
                                </div>
                              )}
                            </Alert>
                          </div>
                        )}

                        {question.gap_analysis && question.gap_analysis !== 'No gaps identified' && (
                          <div className="col-md-6">
                            <Alert variant="warning" className="gap-alert">
                              <div className="alert-header">
                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                <strong>Gap Analysis:</strong>
                              </div>
                              <div className="alert-content">
                                <MarkdownWithMath content={question.gap_analysis} />
                              </div>
                            </Alert>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <Alert variant="warning">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                No questions evaluation data available.
              </Alert>
            )}
          </div>
        )}

        {/* Error displaying questions */}
        {questionsError && (
          <Alert variant="danger" className="mt-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {questionsError}
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer className="exam-modal-footer">
  <Button variant="secondary" onClick={onHide} className="btn-action">
    Close
  </Button>
  
  {/* Download PDF - Always visible once questions are loaded */}
  {showQuestions && questionsEvaluation && (
    <Button
      variant="success"
      onClick={downloadPDF}
      className="btn-action btn-download"
    >
      <FontAwesomeIcon icon={faDownload} className="me-2" />
      Download PDF
    </Button>
  )}
   
  {/* Loading state */}
  {loadingQuestions && (
    <Button
      variant="primary"
      disabled
      className="btn-action btn-view"
    >
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
        className="me-2"
      />
      Loading Questions...
    </Button>
  )}
</Modal.Footer>
    </Modal>
  );
};

export default ExamDetailsModal;