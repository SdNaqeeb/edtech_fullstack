import React, { createContext, useState, useContext, useEffect } from "react";

const TutorialContext = createContext();

export const TutorialProvider = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(
    localStorage.getItem("tutorialShown") !== "false"
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPage, setCurrentPage] = useState("studentDash");
  const [completedPages, setCompletedPages] = useState(
    JSON.parse(localStorage.getItem("completedTutorialPages") || "[]")
  );
  const [tutorialFlow, setTutorialFlow] = useState(
    localStorage.getItem("tutorialFlow") || "active"
  );

  // Save tutorial state to localStorage whenever it changes
  useEffect(() => {
    // localStorage.setItem("tutorialShown", showTutorial);
  }, [showTutorial]);

  // Save completed pages to localStorage
  useEffect(() => {
    // localStorage.setItem(
    //   "completedTutorialPages",
    //   JSON.stringify(completedPages)
    // );
  }, [completedPages]);

  // Save tutorial flow to localStorage
  useEffect(() => {
    // localStorage.setItem("tutorialFlow", tutorialFlow);
  }, [tutorialFlow]);

  // Function to mark a page as completed or uncompleted
  const markPageCompleted = (pageName, completed = true) => {
    if (completed) {
      // Add to completed pages if not already there
      if (!completedPages.includes(pageName)) {
        console.log(`Marking page ${pageName} as completed`);
        setCompletedPages([...completedPages, pageName]);
      }
    } else {
      // Remove from completed pages
      console.log(`Marking page ${pageName} as not completed`);
      setCompletedPages(completedPages.filter((page) => page !== pageName));
    }
  };

  // Function to reset the tutorial (show it again)
  const resetTutorial = () => {
    setShowTutorial(true);
    setCurrentStep(0);
    setCompletedPages([]);
    setTutorialFlow("active");
    localStorage.removeItem("completedTutorialPages");
    // localStorage.setItem("tutorialShown", true);
    // localStorage.setItem("tutorialFlow", "active");
  };

  // Function to restart tutorial for a specific page
  const restartTutorialForPage = (pageName) => {
    console.log(`Restarting tutorial for page: ${pageName}`);
    setShowTutorial(true);
    setCurrentStep(0);
    // Remove the page from completed pages if it's there
    if (completedPages.includes(pageName)) {
      setCompletedPages(completedPages.filter((page) => page !== pageName));
      // localStorage.setItem(
      //   "completedTutorialPages",
      //   JSON.stringify(completedPages.filter((page) => page !== pageName))
      // );
    }
  };

  // Function to check if tutorial should be shown for a page
  const shouldShowTutorialForPage = (pageName) => {
    // Special handling for the tutorial flow
    if (tutorialFlow === "active") {
      console.log(`Checking tutorial for ${pageName} in active flow`);
      console.log(`Current completed pages:`, completedPages);

      // If we're in StudentDash, always show tutorial
      if (pageName === "studentDash") {
        const shouldShow = showTutorial && !completedPages.includes(pageName);
        console.log(`StudentDash tutorial check: ${shouldShow}`);
        return shouldShow;
      }

      // For QuestionListModal, show if StudentDash is completed
      if (pageName === "questionListModal") {
        const shouldShow =
          showTutorial && completedPages.includes("studentDash");
        console.log(`QuestionListModal tutorial check: ${shouldShow}`);
        return shouldShow;
      }

      // For SolveQuestion, show if QuestionListModal is completed
      if (pageName === "solveQuestion") {
        const shouldShow =
          showTutorial && completedPages.includes("questionListModal");
        console.log(`SolveQuestion tutorial check: ${shouldShow}`);
        return shouldShow;
      }
    }

    // Default fallback
    const shouldShow = showTutorial && !completedPages.includes(pageName);
    console.log(`Default tutorial check for ${pageName}: ${shouldShow}`);
    return shouldShow;
  };

  // Function to continue the tutorial flow
  const continueTutorialFlow = (fromPage, toPage) => {
    console.log(`Continuing tutorial flow from ${fromPage} to ${toPage}`);
    console.log(`Current tutorial flow state:`, tutorialFlow);

    if (tutorialFlow === "active") {
      markPageCompleted(fromPage);
      setCurrentPage(toPage);
      setCurrentStep(0); // Reset step count for the new page
      setShowTutorial(true); // Ensure tutorial is shown for the next page
      console.log(`Tutorial flow continued to ${toPage}`);
    } else {
      console.log(`Cannot continue tutorial flow: flow is ${tutorialFlow}`);
    }
  };

  // Function to exit the tutorial flow
  const exitTutorialFlow = () => {
    console.log("Tutorial flow: exiting flow");
    setTutorialFlow("completed");
  };

  const value = {
    showTutorial,
    setShowTutorial,
    currentStep,
    setCurrentStep,
    currentPage,
    setCurrentPage,
    markPageCompleted,
    resetTutorial,
    restartTutorialForPage,
    shouldShowTutorialForPage,
    completedPages,
    continueTutorialFlow,
    exitTutorialFlow,
    tutorialFlow,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};
