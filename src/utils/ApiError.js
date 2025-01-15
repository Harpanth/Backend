class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors= [],
        statck = ""
    ){
        super(message) // Calls the parent Error class's constructor with the 'message'
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = statck
        } else{
            Error.captureStackTrace(this,this.construnctor)
        }
    }
}

export default ApiError