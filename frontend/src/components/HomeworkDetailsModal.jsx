// src/components/HomeworkDetailsModal.jsx
import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import MarkdownWithMath from './MarkdownWithMath';

const HomeworkDetailsModal = ({ show, onHide, submission }) => {
  const questions = submission?.result_json?.questions || [];
  console.log("🔍 Questions in submission:", questions);

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          📘 Homework Details - {submission?.worksheet_id || submission?.homework}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="mb-3">
          <strong>📅 Submitted On:</strong>{" "}
          {new Date(submission?.submission_timestamp || submission?.submission_date).toLocaleString()} <br />
          {/* <strong>🎓 Class:</strong> {submission?.class || 'N/A'} |{" "}
          <strong>🏫 Board:</strong> {submission?.board || 'CBSE'} <br />
          <strong>🧮 Difficulty:</strong> {submission?.difficulty_level || 'Medium'} |{" "}
          <strong>⏱ Time Allowed:</strong> 30 mins <br />
          <strong>📊 Score:</strong> {submission?.total_score || 0} / {submission?.max_possible_score || 0} |{" "}
          <strong>Grade:</strong> {submission?.grade || 'N/A'} <br /><br /> */}
        </div>

        {questions.length === 0 ? (
          <p className="text-danger">No questions found in this submission.</p>
        ) : (
          questions.map((q, i) => (
            <div key={i} className="mb-4 border p-3 rounded bg-light">
              <h5><strong> Question {i + 1}:</strong> <MarkdownWithMath content={q.question_text || q.question} /></h5>
              
              <p><strong>Score:</strong> {q.total_score} / {q.max_score || q.max_marks}</p>
              <p><strong>Category:</strong> <MarkdownWithMath content={q.answer_category || q.error_type} /></p>
              <p><strong>Concepts:</strong> <MarkdownWithMath content={q.concept_required?.join(", ") || q.concepts_required?.join(", ")} /></p>
              <p><strong>Feedback:</strong> <MarkdownWithMath content={q.comment || q.gap_analysis} /></p>
              <p><strong>Correction:</strong> <MarkdownWithMath content={q.correction_comment || q.mistakes_made} /></p>
            </div>
          ))
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HomeworkDetailsModal;
