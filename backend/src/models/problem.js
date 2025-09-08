// const mongoose = require('mongoose');
// const {Schema} = mongoose;

// const problemSchema = new Schema({
//     title:{
//         type:String,
//         required:true
//     },
//     description:{
//         type:String,
//         required:true
//     },
//     difficulty:{
//         type:String,
//         enum:['easy','medium','hard'],
//         required:true,
//     },
//     tags:{
//         type:String,
//         enum:['array','linkedList','graph','dp'],
//         required:true
//     },
//     visibleTestCases:[
//         {
//             input:{
//                 type:String,
//                 required:true,
//             },
//             output:{
//                 type:String,
//                 required:true,
//             },
//             explanation:{
//                 type:String,
//                 required:true
//             }
//         }
//     ],

//     hiddenTestCases:[
//         {
//             input:{
//                 type:String,
//                 required:true,
//             },
//             output:{
//                 type:String,
//                 required:true,
//             }
//         }
//     ],

//     startCode: [
//         {
//             language:{
//                 type:String,
//                 required:true,
//             },
//             initialCode:{
//                 type:String,
//                 required:true
//             }
//         }
//     ],

//     referenceSolution:[
//         {
//             language:{
//                 type:String,
//                 required:true,
//             },
//             completeCode:{
//                 type:String,
//                 required:true
//             }
//         }
//     ],

//     problemCreator:{
//         type: Schema.Types.ObjectId,
//         ref:'user',
//         required:true
//     }
// })


// const Problem = mongoose.model('problem',problemSchema);

// module.exports = Problem;


const mongoose = require('mongoose');
const { Schema } = mongoose;

const problemSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    difficulty: {
        type: String,
        enum: {
            values: ['easy', 'medium', 'hard'],
            message: 'Difficulty must be easy, medium, or hard'
        },
        required: [true, 'Difficulty is required'],
        lowercase: true
    },
    tags: {
        type: String,
        enum: {
            values: ['array', 'linkedList', 'graph', 'dp', 'array,linkedList', 'array,graph', 'array,dp', 'linkedList,graph', 'linkedList,dp', 'graph,dp', 'array,linkedList,graph', 'array,linkedList,dp', 'array,graph,dp', 'linkedList,graph,dp', 'array,linkedList,graph,dp'],
            message: 'Tags must contain valid values: array, linkedList, graph, dp'
        },
        required: [true, 'Tags are required'],
        validate: {
            validator: function(value) {
                if (!value) return false;
                const validTags = ['array', 'linkedList', 'graph', 'dp'];
                const tags = value.split(',').map(tag => tag.trim());
                return tags.every(tag => validTags.includes(tag));
            },
            message: 'All tags must be from: array, linkedList, graph, dp'
        }
    },
    visibleTestCases: [{
        input: {
            type: String,
            required: [true, 'Visible test case input is required'],
            trim: true
        },
        output: {
            type: String,
            required: [true, 'Visible test case output is required'],
            trim: true
        },
        explanation: {
            type: String,
            required: [true, 'Visible test case explanation is required'],
            trim: true
        }
    }],
    
    hiddenTestCases: [{
        input: {
            type: String,
            required: [true, 'Hidden test case input is required'],
            trim: true
        },
        output: {
            type: String,
            required: [true, 'Hidden test case output is required'],
            trim: true
        }
    }],
    
    startCode: [{
        language: {
            type: String,
            required: [true, 'Start code language is required'],
            trim: true
        },
        initialCode: {
            type: String,
            required: [true, 'Initial code is required']
        }
    }],
    
    referenceSolution: [{
        language: {
            type: String,
            required: [true, 'Reference solution language is required'],
            trim: true
        },
        completeCode: {
            type: String,
            required: [true, 'Complete code is required']
        }
    }],
    
    problemCreator: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'Problem creator is required']
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add validation for minimum array lengths
problemSchema.pre('save', function(next) {
    if (this.visibleTestCases && this.visibleTestCases.length === 0) {
        return next(new Error('At least one visible test case is required'));
    }
    if (this.startCode && this.startCode.length === 0) {
        return next(new Error('At least one start code is required'));
    }
    if (this.referenceSolution && this.referenceSolution.length === 0) {
        return next(new Error('At least one reference solution is required'));
    }
    next();
});

const Problem = mongoose.model('problem', problemSchema);

module.exports = Problem;