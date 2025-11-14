import pool from '../db/connection.js';

// Utility function to safely parse JSON or comma-separated strings
const safeJsonParse = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
  }
  return [];
};

// ✅ Fetch all employees
export const getAllEmployees = async (req, res) => {
  const { search = '', availability = '' } = req.query;
  try {
    const conn = await pool.getConnection();
    let query = 'SELECT * FROM people';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR current_skills LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (availability && availability !== 'All') {
      conditions.push('availability = ?');
      params.push(availability);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY name ASC';

    const [employees] = await conn.query(query, params);
    conn.release();

    const formattedEmployees = employees.map(emp => ({
      ...emp,
      current_skills: safeJsonParse(emp.current_skills),
      interests: safeJsonParse(emp.interests),
      previous_projects: safeJsonParse(emp.previous_projects)
    }));

    res.json(formattedEmployees);
  } catch (err) {
    console.error('Fetch employees error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// ✅ Fetch employee by ID
export const getEmployeeById = async (req, res) => {
  const { empid } = req.params;
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM people WHERE empid = ?', [empid]);
    conn.release();

    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });

    const emp = rows[0];
    emp.current_skills = safeJsonParse(emp.current_skills);
    emp.interests = safeJsonParse(emp.interests);
    emp.previous_projects = safeJsonParse(emp.previous_projects);

    res.json(emp);
  } catch (err) {
    console.error('Fetch employee error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// ✅ Update employee profile
export const updateEmployee = async (req, res) => {
  const { empid } = req.params;
  const { availability, hours_available, from_date, to_date, current_skills, interests, previous_projects } = req.body;

  if (availability !== 'Partially Available' && (hours_available || from_date || to_date)) {
    return res.status(400).json({ error: 'Hours and dates should only be set for "Partially Available"' });
  }
  if (availability === 'Partially Available' && (!hours_available || !from_date || !to_date)) {
    return res.status(400).json({ error: 'Hours, from date, and to date are required for "Partially Available"' });
  }

  try {
    const conn = await pool.getConnection();
    await conn.query(
      `UPDATE people SET 
        availability = ?, 
        hours_available = ?, 
        from_date = ?, 
        to_date = ?, 
        current_skills = ?, 
        interests = ?, 
        previous_projects = ? 
      WHERE empid = ?`,
      [
        availability,
        availability === 'Partially Available' ? hours_available : null,
        availability === 'Partially Available' ? from_date : null,
        availability === 'Partially Available' ? to_date : null,
        JSON.stringify(current_skills || []),
        JSON.stringify(interests || []),
        JSON.stringify(previous_projects || []),
        empid
      ]
    );
    conn.release();

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};