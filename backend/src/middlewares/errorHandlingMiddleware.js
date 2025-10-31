const sendDevError = (error, res) => {
    res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
        error,
        stack: error.stack,
    });
};

const sendProdError = (error, res) => {
    if (error.isOperational) {
        return res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
    } else {
        console.log("💥 Error: ", error.message);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
};

const globalErrorHandler = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";
    if (process.env.NODE_ENV === "development") {
        sendDevError(error, res);
    } else if (process.env.NODE_ENV === "production") {
        let err = { ...error };
        err.message = error.message;
        sendProdError(error, res);
    }
};

module.exports = globalErrorHandler;
