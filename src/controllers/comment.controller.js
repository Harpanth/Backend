import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import cookieParser from "cookie-parser"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Schema.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addField: {
                likedCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond:{
                        if: { $in: [req.user?._id, "$likes.likedBy" ] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $project:{
                content:1,
                createdAt:1,
                likesCount:1,
                owner:{
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1 
                },
                isLiked:1,
            }
        }
    ]);
    const options = {
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    }

    const comments = await Comment.aggregatePaginate(
        comment,
        options
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200,comments,"Comments fetched Successfully")
        )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner:req.user?._id
    });

    console.log("comment: ",comment)

    if(!comment){
        throw new ApiError(500,"Failed to add comment try again")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,comment,"Comment added Successfully")
        )


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}=req.params;
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    if(comment?.owner.trim() !== req.user?._id.toString()){
        throw new ApiError(400,"only comment owner can edit this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set:{
                content
            }
        },
        {new:true}
    );
    if (!updatedComment) {
        throw new ApiError(500, "Failed to edit comment please try again");
    }
    return res 
        .status(200)
        .json(
            new ApiResponse(200,updatedComment,"Comment updated Successfully")
        )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    if(!comment?.owner.trim() !== req.user?._id.toString()){
        throw new ApiResponse(400,"only owner can delete the comment")
    }

    await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({
        comment:commentId,
        likedBy:req.user
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}