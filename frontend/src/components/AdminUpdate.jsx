import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { NavLink } from 'react-router'; // ✅ Correct import

const AdminUpdate = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p._id.includes(search)
  );

  if (loading) return <div className="flex justify-center items-center h-64"><span className="loading loading-spinner loading-lg"></span></div>;
  if (error) return <div className="alert alert-error my-4">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Update Problems</h1>

      <input
        type="text"
        placeholder="Search by ID or title..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input input-bordered w-full max-w-xs mb-4"
      />

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.map((problem, index) => (
              <tr key={problem._id}>
                <th>{index + 1}</th>
                <td>{problem.title}</td>
                <td>
                  <span className={`badge ${
                    problem.difficulty === 'Easy' ? 'badge-success' :
                    problem.difficulty === 'Medium' ? 'badge-warning' :
                    'badge-error'
                  }`}>{problem.difficulty}</span>
                </td>
                <td>
                  <span className="badge badge-outline">{problem.tags}</span>
                </td>
                <td>
                  <NavLink 
                    to={`/admin/update/${problem._id}`}
                    className="btn btn-sm btn-primary"
                  >
                    Update
                  </NavLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUpdate;
