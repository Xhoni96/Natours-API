class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    // kjo duhet per te testuar me vone me kte kusht sepse me kte klase duam ti dergojme klientit vetem operational errors jo programming errors or other errors;

    // Error.captureStackTrace(this, this.constructor);
    // duke qene se keto errore jane operational kjo duhet qe mos te pollute dhe stackTrace me errorin e klases tone.
    // po njesoj duket si me kte si pa kte errori shfaqet ne err.stack. TODO.
  }
}

module.exports = AppError;

// Our custom class for global error handling. Ajo qe ndodh eshte qe kjo klase extends nga Error object ne js dhe sa here kemi nje error therrasim kte klase, kjo do te
// hedhi nje error te ri ne js, i cili do te beje qe te aktivizohet funksioni jone middleware global per error handling "errorController" ne tourController
// dhe ai ben dergimin e pergjigjes
