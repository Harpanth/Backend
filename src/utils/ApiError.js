class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors= [],
        stack = ""
    ){
        super(message) // Calls the parent Error class's constructor with the 'message'
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = stack
        } else{
            Error.captureStackTrace(this,this.construnctor)
        }
    }
}

export default ApiError