import sheetDB from "../db/connection.js";

// Utility to parse arrays
const safeJsonParse = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(",").map((i) => i.trim()).filter(Boolean);
    }
  }
  return [];
};

// ---------------------------
// GET ALL EMPLOYEES
// ---------------------------
export const getAllEmployees = async (req, res) => {
  const { search = "", availability = "" } = req.query;

  try {
    const { data: employees } = await sheetDB.get("/");

    const filtered = employees
      .filter((emp) => {
        const matchesSearch =
          !search ||
          emp.name?.toLowerCase().includes(search.toLowerCase()) ||
          emp.current_skills?.toLowerCase().includes(search.toLowerCase());

        const matchesAvail =
          !availability || availability === "All" || emp.availability === availability;

        return matchesSearch && matchesAvail;
      })
      .map((emp) => ({
        ...emp,
        current_skills: safeJsonParse(emp.current_skills),
        interests: safeJsonParse(emp.interests),
        previous_projects: safeJsonParse(emp.previous_projects),
      }));

    res.json(filtered);
  } catch (err) {
    console.error("Fetch employees error →", err);
    res.status(500).json({ error: "SheetDB fetch error" });
  }
};

// ---------------------------
// GET EMPLOYEE BY empid
// ---------------------------
export const getEmployeeById = async (req, res) => {
  const { empid } = req.params;

  try {
    const { data } = await sheetDB.get("/search", {
      params: { empid }
    });

    if (!data || data.length === 0)
      return res.status(404).json({ error: "Employee not found" });

    const emp = data[0];

    emp.current_skills = safeJsonParse(emp.current_skills);
    emp.interests = safeJsonParse(emp.interests);
    emp.previous_projects = safeJsonParse(emp.previous_projects);

    res.json(emp);
  } catch (err) {
    console.error("Fetch employee error →", err);
    res.status(500).json({ error: "SheetDB fetch error" });
  }
};

// ---------------------------
// UPDATE EMPLOYEE
// ---------------------------
export const updateEmployee = async (req, res) => {
  const { empid } = req.params;

  const {
    availability,
    hours_available,
    from_date,
    to_date,
    current_skills,
    interests,
    previous_projects,
  } = req.body;

  // Validation logic stays same
  if (
    availability !== "Partially Available" &&
    (hours_available || from_date || to_date)
  ) {
    return res.status(400).json({
      error: 'Hours and dates should only be set for "Partially Available"',
    });
  }

  if (
    availability === "Partially Available" &&
    (!hours_available || !from_date || !to_date)
  ) {
    return res.status(400).json({
      error: 'Hours, from date, and to date are required for "Partially Available"',
    });
  }

  try {
    await sheetDB.put(`/empid/${empid}`, {
      data: [
        {
          availability,
          hours_available:
            availability === "Partially Available" ? hours_available : "",
          from_date: availability === "Partially Available" ? from_date : "",
          to_date: availability === "Partially Available" ? to_date : "",
          current_skills: JSON.stringify(current_skills || []),
          interests: JSON.stringify(interests || []),
          previous_projects: JSON.stringify(previous_projects || []),
        }
      ]
    });

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update employee error →", err);
    res.status(500).json({ error: "SheetDB update error" });
  }
};
