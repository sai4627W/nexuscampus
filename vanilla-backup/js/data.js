/* ============================================================
   data.js - rich seed dataset for NexusCampus
   Returned fresh on "Reset Demo Data"
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.seed = function seed() {
  const today = new Date();
  const iso = (d) => d.toISOString();

  // ---------- Campus map graph (viewBox 1000 x 700) ----------
  const nodes = [
    { id: 'main_gate',    name: 'Main Gate',            short: 'GATE',  x: 500, y: 655, type: 'gate',      crowd: 'low',    desc: 'Primary entrance & security post' },
    { id: 'academic_a',   name: 'Academic Block A',     short: 'BLK-A', x: 300, y: 445, type: 'academic',  crowd: 'medium', desc: 'Classrooms, faculty offices, exam cell' },
    { id: 'ai_lab',       name: 'AI & ML Research Lab', short: 'AI-LAB',x: 175, y: 285, type: 'lab',       crowd: 'high',   desc: 'GPU compute cluster & robotics bay' },
    { id: 'library',      name: 'Central Library',      short: 'LIB',   x: 505, y: 380, type: 'library',   crowd: 'high',   desc: '3 floors, digital archive, study pods' },
    { id: 'boys_hostel',  name: 'Boys Hostel',          short: 'BH',    x: 830, y: 520, type: 'hostel',    crowd: 'medium', desc: 'Residence blocks B1-B4' },
    { id: 'girls_hostel', name: 'Girls Hostel',         short: 'GH',    x: 865, y: 300, type: 'hostel',    crowd: 'medium', desc: 'Residence blocks G1-G3' },
    { id: 'cafeteria',    name: 'Main Cafeteria',       short: 'CAFE',  x: 655, y: 560, type: 'food',      crowd: 'high',   desc: 'Multi-cuisine food court & juice bar' },
    { id: 'auditorium',   name: 'Auditorium',           short: 'AUD',   x: 435, y: 195, type: 'event',     crowd: 'low',    desc: '1200-seat convocation hall' },
    { id: 'sports',       name: 'Sports Complex',       short: 'SPRT',  x: 120, y: 560, type: 'sports',    crowd: 'low',    desc: 'Track, gym, indoor courts' },
    { id: 'medical',      name: 'Medical Center',       short: 'MED',   x: 760, y: 420, type: 'medical',   crowd: 'low',    desc: '24x7 clinic & ambulance bay' }
  ];

  const edges = [
    ['main_gate', 'academic_a', 185],
    ['main_gate', 'cafeteria', 130],
    ['main_gate', 'sports', 205],
    ['academic_a', 'ai_lab', 165],
    ['academic_a', 'library', 135],
    ['academic_a', 'auditorium', 150],
    ['library', 'auditorium', 205],
    ['library', 'boys_hostel', 220],
    ['library', 'medical', 185],
    ['library', 'cafeteria', 160],
    ['cafeteria', 'boys_hostel', 145],
    ['cafeteria', 'sports', 260],
    ['boys_hostel', 'medical', 130],
    ['medical', 'girls_hostel', 120],
    ['girls_hostel', 'auditorium', 215],
    ['auditorium', 'ai_lab', 175],
    ['girls_hostel', 'library', 240]
  ];

  // ---------- Indoor floor plans ----------
  const indoors = {
    academic_a: {
      'Ground Floor': [
        { room: 'A-001', name: 'Exam Cell', status: 'Free', detail: 'Open till 5:00 PM' },
        { room: 'A-004', name: 'Seminar Hall', status: 'Occupied', detail: 'Placement talk till 1:30 PM' },
        { room: 'A-006', name: 'Reception', status: 'Free', detail: 'Always open' }
      ],
      '1st Floor': [
        { room: 'A-101', name: 'CSE Classroom', status: 'Occupied', detail: 'DBMS Lecture till 2:00 PM' },
        { room: 'A-104', name: 'Digital Electronics Lab', status: 'Free', detail: 'Next lab at 3:00 PM' },
        { room: 'A-108', name: 'Faculty Room', status: 'Free', detail: '9 staff present' }
      ],
      '2nd Floor': [
        { room: 'A-201', name: 'Data Structures Lab', status: 'Occupied', detail: 'Practical till 1:45 PM' },
        { room: 'A-205', name: 'Project Room', status: 'Free', detail: 'Capacity 12' }
      ]
    },
    ai_lab: {
      'Ground Floor': [
        { room: 'AI-01', name: 'Robotics Bay', status: 'Occupied', detail: 'Autonomous drone tests' },
        { room: 'AI-03', name: 'Server Room', status: 'Restricted', detail: 'Authorised staff only' }
      ],
      '1st Floor': [
        { room: 'AI-101', name: 'GPU Compute Cluster', status: 'Free', detail: '8x A100 available' },
        { room: 'AI-104', name: 'Vision Lab', status: 'Occupied', detail: 'Research demo till 4:00 PM' }
      ],
      '2nd Floor': [
        { room: 'AI-201', name: 'ML Lecture Hall', status: 'Free', detail: 'Free after 2:30 PM' }
      ]
    },
    library: {
      'Ground Floor': [
        { room: 'L-001', name: 'Reading Hall', status: 'Occupied', detail: 'High occupancy' },
        { room: 'L-005', name: 'Digital Archive', status: 'Free', detail: 'Self-service kiosks' }
      ],
      '1st Floor': [
        { room: 'L-101', name: 'Study Pods', status: 'Partially Free', detail: '4 of 10 pods free' },
        { room: 'L-108', name: 'Journal Section', status: 'Free', detail: 'Quiet zone' }
      ],
      '2nd Floor': [
        { room: 'L-201', name: 'Group Discussion Rooms', status: 'Occupied', detail: 'Booked till 3:00 PM' }
      ]
    }
  };

  // ---------- Attendance ----------
  const subjects = [
    { id: 's1', code: 'CS301', name: 'Data Structures & Algorithms', attended: 32, total: 40, faculty: 'Dr. Meera Nair' },
    { id: 's2', code: 'CS302', name: 'Database Management Systems', attended: 28, total: 38, faculty: 'Prof. R. Kulkarni' },
    { id: 's3', code: 'CS303', name: 'Operating Systems', attended: 22, total: 36, faculty: 'Dr. S. Iyer' },
    { id: 's4', code: 'AI401', name: 'Machine Learning Foundations', attended: 35, total: 39, faculty: 'Dr. A. Bhatt' },
    { id: 's5', code: 'CS305', name: 'Computer Networks', attended: 18, total: 34, faculty: 'Prof. N. Verma' }
  ];

  // ---------- Timetable (per weekday, times HH:MM) ----------
  const timetable = {
    1: [ { time: '09:00', subject: 'Data Structures & Algorithms', room: 'A-101', code: 'CS301' },
         { time: '11:00', subject: 'Machine Learning Foundations', room: 'AI-201', code: 'AI401' },
         { time: '14:00', subject: 'Operating Systems', room: 'A-201', code: 'CS303' } ],
    2: [ { time: '10:00', subject: 'Database Management Systems', room: 'A-101', code: 'CS302' },
         { time: '13:00', subject: 'Computer Networks', room: 'AI-101', code: 'CS305' } ],
    3: [ { time: '09:00', subject: 'Data Structures & Algorithms', room: 'A-101', code: 'CS301' },
         { time: '11:00', subject: 'Machine Learning Foundations', room: 'AI-201', code: 'AI401' },
         { time: '15:00', subject: 'Database Management Systems', room: 'A-104', code: 'CS302' } ],
    4: [ { time: '10:00', subject: 'Operating Systems', room: 'A-201', code: 'CS303' },
         { time: '12:00', subject: 'Computer Networks', room: 'AI-101', code: 'CS305' } ],
    5: [ { time: '09:00', subject: 'Machine Learning Foundations', room: 'AI-201', code: 'AI401' },
         { time: '11:00', subject: 'Data Structures & Algorithms', room: 'A-101', code: 'CS301' },
         { time: '14:00', subject: 'Database Management Systems', room: 'A-101', code: 'CS302' } ],
    6: [ { time: '10:00', subject: 'Project & Research Lab', room: 'AI-104', code: 'PRJ' } ],
    0: []
  };

  // ---------- Cafeteria ----------
  const menu = [
    { id: 'm1', name: 'Cold Coffee',        category: 'Beverages', price: 60,  prep: 4,  emoji: '🧋' },
    { id: 'm2', name: 'Masala Chai',        category: 'Beverages', price: 20,  prep: 3,  emoji: '🍵' },
    { id: 'm3', name: 'Fresh Lime Soda',    category: 'Beverages', price: 40,  prep: 2,  emoji: '🥤' },
    { id: 'm4', name: 'Masala Dosa',        category: 'Breakfast', price: 70,  prep: 8,  emoji: '🥞' },
    { id: 'm5', name: 'Poha & Chai Combo',  category: 'Breakfast', price: 45,  prep: 5,  emoji: '🍚' },
    { id: 'm6', name: 'Idli Vada Plate',    category: 'Breakfast', price: 55,  prep: 6,  emoji: '🍥' },
    { id: 'm7', name: 'Veg Thali',          category: 'Lunch',     price: 120, prep: 12, emoji: '🍛' },
    { id: 'm8', name: 'Paneer Butter Masala',category: 'Lunch',    price: 150, prep: 14, emoji: '🥘' },
    { id: 'm9', name: 'Chicken Biryani',    category: 'Lunch',     price: 180, prep: 15, emoji: '🍗' },
    { id: 'm10', name: 'Veg Fried Rice',    category: 'Lunch',     price: 110, prep: 10, emoji: '🍚' },
    { id: 'm11', name: 'Samosa (2 pcs)',    category: 'Snacks',    price: 30,  prep: 3,  emoji: '🥟' },
    { id: 'm12', name: 'Veg Sandwich',      category: 'Snacks',    price: 50,  prep: 5,  emoji: '🥪' },
    { id: 'm13', name: 'Chocolate Brownie', category: 'Snacks',    price: 65,  prep: 4,  emoji: '🍫' }
  ];

  // ---------- Facilities ----------
  const machines = [
    { id: 'wm1', name: 'Washing Machine 1', status: 'Available', endsAt: null, user: null },
    { id: 'wm2', name: 'Washing Machine 2', status: 'In Use',    endsAt: iso(new Date(today.getTime() + 18 * 60000)), user: 'Rohan' },
    { id: 'wm3', name: 'Washing Machine 3', status: 'Available', endsAt: null, user: null },
    { id: 'wm4', name: 'Washing Machine 4', status: 'Booked',    endsAt: iso(new Date(today.getTime() + 40 * 60000)), user: 'Isha' },
    { id: 'wm5', name: 'Washing Machine 5', status: 'Available', endsAt: null, user: null },
    { id: 'wm6', name: 'Washing Machine 6', status: 'In Use',    endsAt: iso(new Date(today.getTime() + 7 * 60000)), user: 'Karthik' }
  ];

  const pods = [
    { id: 'pod1', name: 'Study Pod P1', status: 'Available', endsAt: null, user: null },
    { id: 'pod2', name: 'Study Pod P2', status: 'In Use',    endsAt: iso(new Date(today.getTime() + 25 * 60000)), user: 'Neha' },
    { id: 'pod3', name: 'Study Pod P3', status: 'Available', endsAt: null, user: null },
    { id: 'pod4', name: 'Study Pod P4', status: 'Booked',    endsAt: iso(new Date(today.getTime() + 55 * 60000)), user: 'Arjun' }
  ];

  return {
    profile: { name: 'Aarav Rao', initials: 'AR', id: 'CSE · 2024A1PS0456', wallet: 1540 },
    nodes, edges, indoors,
    subjects, timetable, menu, machines, pods,
    gatePasses: [],
    orders: [],
    tickets: [
      { id: uidT(), title: 'AC leaking in Block A Room 204', dept: 'Electrical', priority: 'Urgent', status: 'Reported', location: 'Academic Block A', createdAt: iso(new Date(today.getTime() - 22 * 60000)) },
      { id: uidT(), title: 'Projector not turning on in A-101', dept: 'IT Support', priority: 'Medium', status: 'Assigned', location: 'Academic Block A', createdAt: iso(new Date(today.getTime() - 90 * 60000)) },
      { id: uidT(), title: 'Lost Blue Water Bottle near Library', dept: 'Lost & Found', priority: 'Low', status: 'Reported', location: 'Central Library', createdAt: iso(new Date(today.getTime() - 40 * 60000)) }
    ],
    attendanceLog: [],
    crowd: {
      cafeteria: 'high', library: 'high', ai_lab: 'high',
      academic_a: 'medium', boys_hostel: 'medium', girls_hostel: 'medium',
      main_gate: 'low', auditorium: 'low', sports: 'low', medical: 'low'
    },
    createdAt: iso(new Date())
  };

  function uidT() { return 'tk_' + Math.random().toString(36).slice(2, 9); }
};
