

export default response = (res, status=200, success=true, message, data=null ) => {
    return res.status(status).json({
        success: success,
        message: message,
        data: data
    });
};