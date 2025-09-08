const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")

const createProblem = async (req,res)=>{
   
  // API request to authenticate user:
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;


    try{
       
      for(const {language,completeCode} of referenceSolution){
         

        // source_code:
        // language_id:
        // stdin: 
        // expectedOutput:

        const languageId = getLanguageById(language);
          
        // I am creating Batch submission
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));


        const submitResult = await submitBatch(submissions);
        // console.log(submitResult);

        const resultToken = submitResult.map((value)=> value.token);

        // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
        
       const testResult = await submitToken(resultToken);


       console.log(testResult);

       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).send("Error Occured");
        }
       }

      }


      // We can store it in our DB

    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Saved Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const updateProblem = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    if (!id) return res.status(400).send("Missing ID Field");

    const problem = await Problem.findById(id);
    if (!problem) return res.status(404).send("Problem not found");

    // Log incoming data for debugging
    console.log("Update Fields:", JSON.stringify(updateFields, null, 2));

    // Validate and transform tags
    if (updateFields.tags) {
      let tagsArray;
      if (typeof updateFields.tags === 'string') {
        tagsArray = updateFields.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      } else if (Array.isArray(updateFields.tags)) {
        tagsArray = updateFields.tags.map(tag => tag.trim()).filter(Boolean);
      }
      
      // Validate against enum values
      const validTags = ['array', 'linkedList', 'graph', 'dp'];
      const invalidTags = tagsArray.filter(tag => !validTags.includes(tag));
      
      if (invalidTags.length > 0) {
        return res.status(400).send(`Invalid tags: ${invalidTags.join(', ')}. Valid tags are: ${validTags.join(', ')}`);
      }
      
      // Convert back to comma-separated string to match schema
      updateFields.tags = tagsArray.join(',');
    }

    // Validate difficulty
    if (updateFields.difficulty && !['easy', 'medium', 'hard'].includes(updateFields.difficulty)) {
      return res.status(400).send("Invalid difficulty. Must be: easy, medium, or hard");
    }

    // Clean up test cases - remove empty ones
    if (updateFields.visibleTestCases) {
      updateFields.visibleTestCases = updateFields.visibleTestCases.filter(tc => 
        tc && tc.input && tc.output && tc.explanation
      );
    }

    if (updateFields.hiddenTestCases) {
      updateFields.hiddenTestCases = updateFields.hiddenTestCases.filter(tc => 
        tc && tc.input && tc.output
      );
    }

    if (updateFields.startCode) {
      updateFields.startCode = updateFields.startCode.filter(sc => 
        sc && sc.language && sc.initialCode
      );
    }

    if (updateFields.referenceSolution) {
      updateFields.referenceSolution = updateFields.referenceSolution.filter(rs => 
        rs && rs.language && rs.completeCode
      );
    }

    // Only validate reference solution if we have both visible test cases and reference solutions
    const hasVisibleCases = updateFields.visibleTestCases && updateFields.visibleTestCases.length > 0;
    const hasReferenceSolutions = updateFields.referenceSolution && updateFields.referenceSolution.length > 0;

    if (hasVisibleCases && hasReferenceSolutions) {
      console.log("Validating reference solutions...");
      
      for (const { language, completeCode } of updateFields.referenceSolution) {
        if (!language || !completeCode) continue;

        try {
          const languageId = getLanguageById(language);
          
          if (!languageId) {
            return res.status(400).send(`Unsupported language: ${language}`);
          }

          const submissions = updateFields.visibleTestCases.map(tc => ({
            source_code: completeCode,
            language_id: languageId,
            stdin: tc.input || "",
            expected_output: tc.output || "",
          }));

          const submitResult = await submitBatch(submissions);
          
          if (!submitResult || submitResult.length === 0) {
            return res.status(400).send(`Failed to submit batch for ${language}`);
          }

          const resultToken = submitResult.map(v => v.token).filter(Boolean);
          
          if (resultToken.length === 0) {
            return res.status(400).send(`No valid tokens received for ${language}`);
          }

          const testResult = await submitToken(resultToken);

          for (const test of testResult) {
            if (test.status_id !== 3) {
              console.log(`Test failed for ${language}:`, test);
              return res.status(400).send(`Reference solution for ${language} failed test case. Status: ${test.status_id}`);
            }
          }
        } catch (validationError) {
          console.error(`Validation error for ${language}:`, validationError);
          return res.status(400).send(`Reference solution validation failed for ${language}: ${validationError.message}`);
        }
      }
    }

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined || updateFields[key] === null) {
        delete updateFields[key];
      }
    });

    console.log("Final update fields:", JSON.stringify(updateFields, null, 2));

    // Use findByIdAndUpdate with proper options
    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { 
        new: true, 
        runValidators: true,
        context: 'query' // This helps with some validation issues
      }
    );

    if (!updatedProblem) {
      return res.status(404).send("Problem not found after update");
    }

    console.log("Successfully updated problem:", updatedProblem._id);
    res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      data: updatedProblem
    });

  } catch (err) {
    console.error("Update Problem Error:", err);
    
    // Handle specific MongoDB validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).send(`Validation Error: ${validationErrors.join(', ')}`);
    }
    
    if (err.name === 'CastError') {
      return res.status(400).send(`Invalid data type for field: ${err.path}`);
    }
    
    res.status(500).send("Internal Server Error: " + err.message);
  }
};


const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}


const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');
   
    // video ka jo bhi url wagera le aao

   if(!getProblem)
    return res.status(404).send("Problem is Missing");

   const videos = await SolutionVideo.findOne({problemId:id});

   if(videos){   
    
   const responseData = {
    ...getProblem.toObject(),
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   } 
  
   return res.status(200).send(responseData);
   }
    
   res.status(200).send(getProblem);

  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags');

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}


const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      
      res.status(200).send(user.problemSolved);

    }
    catch(err){
      res.status(500).send("Server Error");
    }
}

const submittedProblem = async(req,res)=>{

  try{
     
    const userId = req.result._id;
    const problemId = req.params.pid;

   const ans = await Submission.find({userId,problemId});
  
  if(ans.length==0)
    res.status(200).send("No Submission is persent");

  res.status(200).send(ans);

  }
  catch(err){
     res.status(500).send("Internal Server Error");
  }
}



module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};


