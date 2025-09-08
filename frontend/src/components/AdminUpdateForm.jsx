import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm, useFieldArray } from "react-hook-form";
import axiosClient from "../utils/axiosClient";

const AdminUpdateForm = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      title: "",
      description: "",
      difficulty: "easy",
      tags: "",
      visibleTestCases: [{ input: "", output: "", explanation: "" }],
      hiddenTestCases: [{ input: "", output: "" }],
      startCode: [
        { language: "C++", initialCode: "" },
        { language: "Java", initialCode: "" },
        { language: "JavaScript", initialCode: "" },
      ],
      referenceSolution: [
        { language: "C++", completeCode: "" },
        { language: "Java", completeCode: "" },
        { language: "JavaScript", completeCode: "" },
      ],
    },
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } =
    useFieldArray({ control, name: "visibleTestCases" });

  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } =
    useFieldArray({ control, name: "hiddenTestCases" });

  const { fields: startCodeFields, append: appendStartCode, remove: removeStartCode } =
    useFieldArray({ control, name: "startCode" });

  const { fields: referenceFields, append: appendReference, remove: removeReference } =
    useFieldArray({ control, name: "referenceSolution" });

  // Prefill form with existing problem
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        setError("");
        
        const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);
        
        console.log("Fetched problem data:", data);

        // Transform the data to match form structure
        const formData = {
          ...data,
          tags: typeof data.tags === 'string' ? data.tags : (Array.isArray(data.tags) ? data.tags.join(', ') : ""),
          visibleTestCases: data.visibleTestCases && data.visibleTestCases.length > 0 
            ? data.visibleTestCases 
            : [{ input: "", output: "", explanation: "" }],
          hiddenTestCases: data.hiddenTestCases && data.hiddenTestCases.length > 0 
            ? data.hiddenTestCases 
            : [{ input: "", output: "" }],
          startCode: data.startCode && data.startCode.length > 0 
            ? data.startCode 
            : [
                { language: "C++", initialCode: "" },
                { language: "Java", initialCode: "" },
                { language: "JavaScript", initialCode: "" },
              ],
          referenceSolution: data.referenceSolution && data.referenceSolution.length > 0 
            ? data.referenceSolution 
            : [
                { language: "C++", completeCode: "" },
                { language: "Java", completeCode: "" },
                { language: "JavaScript", completeCode: "" },
              ],
        };

        reset(formData);
      } catch (err) {
        console.error("Failed to fetch problem:", err);
        setError("Failed to fetch problem: " + (err.response?.data || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    if (problemId) {
      fetchProblem();
    }
  }, [problemId, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      
      // Create a clean payload
      const payload = {
        title: data.title?.trim(),
        description: data.description?.trim(),
        difficulty: data.difficulty,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean).join(',') : "",
        visibleTestCases: (data.visibleTestCases || [])
          .filter(tc => tc && tc.input?.trim() && tc.output?.trim() && tc.explanation?.trim())
          .map(tc => ({
            input: tc.input.trim(),
            output: tc.output.trim(),
            explanation: tc.explanation.trim()
          })),
        hiddenTestCases: (data.hiddenTestCases || [])
          .filter(tc => tc && tc.input?.trim() && tc.output?.trim())
          .map(tc => ({
            input: tc.input.trim(),
            output: tc.output.trim()
          })),
        startCode: (data.startCode || [])
          .filter(sc => sc && sc.language?.trim() && sc.initialCode?.trim())
          .map(sc => ({
            language: sc.language.trim(),
            initialCode: sc.initialCode.trim()
          })),
        referenceSolution: (data.referenceSolution || [])
          .filter(rs => rs && rs.language?.trim() && rs.completeCode?.trim())
          .map(rs => ({
            language: rs.language.trim(),
            completeCode: rs.completeCode.trim()
          }))
      };

      // Validate required fields
      if (!payload.title) {
        setError("Title is required");
        return;
      }
      if (!payload.description) {
        setError("Description is required");
        return;
      }
      if (payload.visibleTestCases.length === 0) {
        setError("At least one visible test case is required");
        return;
      }
      if (payload.startCode.length === 0) {
        setError("At least one start code is required");
        return;
      }
      if (payload.referenceSolution.length === 0) {
        setError("At least one reference solution is required");
        return;
      }

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const response = await axiosClient.put(`/problem/update/${problemId}`, payload);
      
      console.log('Update response:', response.data);
      
      alert('Problem updated successfully!');
      navigate('/admin/update');
      
    } catch (err) {
      console.error('Update failed:', err);
      const errorMessage = err.response?.data || err.message || 'Unknown error occurred';
      setError('Failed to update problem: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Update Problem</h1>
      
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Title *</span>
          </label>
          <input 
            {...register("title", { required: "Title is required" })} 
            className="input input-bordered w-full" 
            placeholder="Enter problem title"
          />
        </div>

        <div>
          <label className="label">
            <span className="label-text">Description *</span>
          </label>
          <textarea 
            {...register("description", { required: "Description is required" })} 
            className="textarea textarea-bordered w-full h-24" 
            placeholder="Enter problem description"
          />
        </div>

        <div>
          <label className="label">
            <span className="label-text">Difficulty *</span>
          </label>
          <select {...register("difficulty")} className="select select-bordered w-full">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="label">
            <span className="label-text">Tags (comma separated) *</span>
          </label>
          <input 
            {...register("tags")} 
            className="input input-bordered w-full" 
            placeholder="e.g., array, graph, dp"
          />
          <div className="label">
            <span className="label-text-alt">Valid tags: array, linkedList, graph, dp</span>
          </div>
        </div>

        {/* Visible Test Cases */}
        <div>
          <label className="label">
            <span className="label-text">Visible Test Cases *</span>
          </label>
          {visibleFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded mb-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input 
                  {...register(`visibleTestCases.${index}.input`)} 
                  placeholder="Input" 
                  className="input input-bordered w-full" 
                />
                <input 
                  {...register(`visibleTestCases.${index}.output`)} 
                  placeholder="Output" 
                  className="input input-bordered w-full" 
                />
                <input 
                  {...register(`visibleTestCases.${index}.explanation`)} 
                  placeholder="Explanation" 
                  className="input input-bordered w-full" 
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeVisible(index)} 
                className="btn btn-error btn-sm mt-2"
                disabled={visibleFields.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => appendVisible({ input: "", output: "", explanation: "" })} 
            className="btn btn-primary btn-sm"
          >
            Add Visible Test Case
          </button>
        </div>

        {/* Hidden Test Cases */}
        <div>
          <label className="label">
            <span className="label-text">Hidden Test Cases</span>
          </label>
          {hiddenFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded mb-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input 
                  {...register(`hiddenTestCases.${index}.input`)} 
                  placeholder="Input" 
                  className="input input-bordered w-full" 
                />
                <input 
                  {...register(`hiddenTestCases.${index}.output`)} 
                  placeholder="Output" 
                  className="input input-bordered w-full" 
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeHidden(index)} 
                className="btn btn-error btn-sm mt-2"
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => appendHidden({ input: "", output: "" })} 
            className="btn btn-primary btn-sm"
          >
            Add Hidden Test Case
          </button>
        </div>

        {/* Start Code */}
        <div>
          <label className="label">
            <span className="label-text">Start Code *</span>
          </label>
          {startCodeFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded mb-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
                <input 
                  {...register(`startCode.${index}.language`)} 
                  placeholder="Language" 
                  className="input input-bordered w-full" 
                />
                <textarea 
                  {...register(`startCode.${index}.initialCode`)} 
                  placeholder="Initial Code" 
                  className="textarea textarea-bordered w-full md:col-span-3" 
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeStartCode(index)} 
                className="btn btn-error btn-sm mt-2"
                disabled={startCodeFields.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => appendStartCode({ language: "", initialCode: "" })} 
            className="btn btn-primary btn-sm"
          >
            Add Start Code
          </button>
        </div>

        {/* Reference Solution */}
        <div>
          <label className="label">
            <span className="label-text">Reference Solutions *</span>
          </label>
          {referenceFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded mb-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
                <input 
                  {...register(`referenceSolution.${index}.language`)} 
                  placeholder="Language" 
                  className="input input-bordered w-full" 
                />
                <textarea 
                  {...register(`referenceSolution.${index}.completeCode`)} 
                  placeholder="Complete Code" 
                  className="textarea textarea-bordered w-full md:col-span-3" 
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeReference(index)} 
                className="btn btn-error btn-sm mt-2"
                disabled={referenceFields.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => appendReference({ language: "", completeCode: "" })} 
            className="btn btn-primary btn-sm"
          >
            Add Reference Solution
          </button>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary mt-4 w-full"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Problem"}
        </button>
      </form>
    </div>
  );
};

export default AdminUpdateForm;