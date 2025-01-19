import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // This storage needs public/images folder in the root directory
    // Else it will throw an error saying cannot find path public/images
    cb(null, "./public/temp");
    },
    filename: function(req,file,cb){

        cb(null, file.originalname)
    }
})

export const upload = multer({ 
    storage,
})