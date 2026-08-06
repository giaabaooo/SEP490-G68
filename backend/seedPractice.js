// seedPractice.js
const mongoose = require('mongoose');
const PracticeTopic = require('./models/PracticeTopic'); // Đảm bảo đường dẫn này trỏ đúng tới file model PracticeTopic.js của bạn

// Đã điền thông tin ID Admin và Mongo URI của bạn
const ADMIN_ID = '6a4344f71d4048ce8044be85'; 
const MONGODB_URI = 'mongodb+srv://vodka:giabao07@cluster0.8ilshsf.mongodb.net/careerio?retryWrites=true&w=majority';

const seedData = [
  // ==========================================
  // BÀI 1: FREE - LẬP TRÌNH JAVASCRIPT CƠ BẢN
  // ==========================================
  {
    topicName: 'Lập trình JavaScript Cơ bản',
    description: 'Kiểm tra kiến thức nền tảng về JS: Biến, kiểu dữ liệu, hàm, vòng lặp.',
    timeLimit: 15,
    level: 'free',
    status: 'PUBLISHED',
    createdBy: ADMIN_ID,
    questions: [
      { questionText: 'Từ khóa nào dùng để khai báo biến có thể gán lại giá trị trong ES6?', options: ['var', 'let', 'const', 'static'], correctAnswer: 1, skill: 'JS Basics', difficulty: 'Easy', isChecked: true },
      { questionText: 'Kết quả của phép toán "5" + 3 trong JavaScript là gì?', options: ['8', '"53"', 'NaN', 'Lỗi'], correctAnswer: 1, skill: 'JS Types', difficulty: 'Easy', isChecked: true },
      { questionText: 'Phương thức nào dùng để thêm một phần tử vào cuối mảng?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctAnswer: 0, skill: 'Arrays', difficulty: 'Easy', isChecked: true },
      { questionText: 'Kiểu dữ liệu của NaN là gì?', options: ['Number', 'String', 'Undefined', 'Object'], correctAnswer: 0, skill: 'JS Types', difficulty: 'Medium', isChecked: true },
      { questionText: 'Hàm setTimeout() hoạt động theo cơ chế nào?', options: ['Đồng bộ (Synchronous)', 'Bất đồng bộ (Asynchronous)', 'Đa luồng (Multi-threading)', 'Tuần tự'], correctAnswer: 1, skill: 'Async JS', difficulty: 'Medium', isChecked: true },
      { questionText: 'Làm thế nào để kiểm tra một biến có phải là mảng hay không?', options: ['typeof arr', 'arr instanceof Array', 'Array.isArray(arr)', 'Cả B và C đều đúng'], correctAnswer: 3, skill: 'Arrays', difficulty: 'Medium', isChecked: true },
      { questionText: 'Đâu không phải là một Data Type nguyên thủy (Primitive) trong JS?', options: ['String', 'Number', 'Object', 'Boolean'], correctAnswer: 2, skill: 'JS Types', difficulty: 'Easy', isChecked: true },
      { questionText: 'Kết quả của biểu thức [] == false là gì?', options: ['true', 'false', 'TypeError', 'undefined'], correctAnswer: 0, skill: 'Coercion', difficulty: 'Hard', isChecked: true },
      { questionText: 'Phương thức nào trả về một mảng mới gồm các phần tử thỏa mãn điều kiện?', options: ['map()', 'filter()', 'reduce()', 'forEach()'], correctAnswer: 1, skill: 'Arrays', difficulty: 'Medium', isChecked: true },
      { questionText: 'Closure trong JavaScript là gì?', options: ['Một hàm truy cập được biến của hàm cha sau khi hàm cha đã thực thi xong', 'Một biến toàn cục', 'Một vòng lặp vô hạn', 'Một thư viện của JS'], correctAnswer: 0, skill: 'JS Concepts', difficulty: 'Hard', isChecked: true }
    ]
  },

  // ==========================================
  // BÀI 2: FREE - REACTJS NỀN TẢNG
  // ==========================================
  {
    topicName: 'ReactJS Nền tảng',
    description: 'Ôn tập về Component, JSX, Hooks (useState, useEffect) và luồng dữ liệu.',
    timeLimit: 20,
    level: 'free',
    status: 'PUBLISHED',
    createdBy: ADMIN_ID,
    questions: [
      { questionText: 'React được phát triển bởi công ty nào?', options: ['Google', 'Facebook', 'Microsoft', 'Twitter'], correctAnswer: 1, skill: 'React Basics', difficulty: 'Easy', isChecked: true },
      { questionText: 'Hook nào dùng để quản lý trạng thái trong Functional Component?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctAnswer: 1, skill: 'React Hooks', difficulty: 'Easy', isChecked: true },
      { questionText: 'Tham số thứ 2 của useEffect là mảng rỗng [] có ý nghĩa gì?', options: ['Chạy mỗi khi state đổi', 'Chỉ chạy 1 lần duy nhất khi mount', 'Không bao giờ chạy', 'Báo lỗi'], correctAnswer: 1, skill: 'React Hooks', difficulty: 'Medium', isChecked: true },
      { questionText: 'Làm sao để truyền dữ liệu từ component cha xuống component con?', options: ['Dùng State', 'Dùng Props', 'Dùng Redux', 'Dùng API'], correctAnswer: 1, skill: 'React Props', difficulty: 'Easy', isChecked: true },
      { questionText: 'Thuộc tính nào là bắt buộc khi render một danh sách các phần tử bằng map()?', options: ['id', 'key', 'index', 'ref'], correctAnswer: 1, skill: 'JSX', difficulty: 'Medium', isChecked: true },
      { questionText: 'Virtual DOM trong React giúp làm gì?', options: ['Tạo giao diện 3D', 'Tối ưu hóa quá trình cập nhật giao diện (Re-render)', 'Thay thế HTML', 'Tăng bảo mật'], correctAnswer: 1, skill: 'React Core', difficulty: 'Medium', isChecked: true },
      { questionText: 'Context API thường được dùng để giải quyết vấn đề gì?', options: ['Prop Drilling', 'Performance', 'Routing', 'Data Fetching'], correctAnswer: 0, skill: 'React Advanced', difficulty: 'Hard', isChecked: true },
      { questionText: 'Hook useMemo dùng để làm gì?', options: ['Ghi nhớ một callback function', 'Ghi nhớ một giá trị tính toán để tránh tính lại', 'Quản lý state phức tạp', 'Tạo ref cho DOM'], correctAnswer: 1, skill: 'React Hooks', difficulty: 'Hard', isChecked: true },
      { questionText: 'Trong JSX, thuộc tính class của HTML phải được viết thành?', options: ['class', 'className', 'css-class', 'style'], correctAnswer: 1, skill: 'JSX', difficulty: 'Easy', isChecked: true },
      { questionText: 'Phương thức vòng đời tương đương với useEffect(..., []) trong Class Component là?', options: ['componentDidMount', 'componentDidUpdate', 'componentWillUnmount', 'render'], correctAnswer: 0, skill: 'React Lifecycle', difficulty: 'Medium', isChecked: true }
    ]
  },

  // ==========================================
  // BÀI 3: FREE - HTML & CSS THỰC CHIẾN
  // ==========================================
  {
    topicName: 'HTML & CSS Thực chiến',
    description: 'Kiểm tra kỹ năng dàn trang, Flexbox, Grid, Responsive Design.',
    timeLimit: 15,
    level: 'free',
    status: 'PUBLISHED',
    createdBy: ADMIN_ID,
    questions: [
      { questionText: 'Thẻ HTML nào mang ý nghĩa quan trọng nhất cho SEO?', options: ['<div>', '<span>', '<h1>', '<b>'], correctAnswer: 2, skill: 'HTML Semantic', difficulty: 'Easy', isChecked: true },
      { questionText: 'Thuộc tính CSS nào dùng để in đậm chữ?', options: ['font-weight', 'text-style', 'font-style', 'text-transform'], correctAnswer: 0, skill: 'CSS Typography', difficulty: 'Easy', isChecked: true },
      { questionText: 'Để căn giữa một khối <div> theo chiều ngang, dùng cách nào?', options: ['margin: 0 auto', 'text-align: center', 'padding: auto', 'float: center'], correctAnswer: 0, skill: 'CSS Layout', difficulty: 'Medium', isChecked: true },
      { questionText: 'Trong Flexbox, thuộc tính nào căn chỉnh phần tử dọc theo trục chính?', options: ['align-items', 'justify-content', 'flex-direction', 'align-content'], correctAnswer: 1, skill: 'CSS Flexbox', difficulty: 'Medium', isChecked: true },
      { questionText: 'Đơn vị vh trong CSS có nghĩa là gì?', options: ['View height', 'Viewport height', 'Vertical height', 'Visual height'], correctAnswer: 1, skill: 'CSS Units', difficulty: 'Medium', isChecked: true },
      { questionText: 'Media Query nào nhắm đến các màn hình có chiều rộng tối đa 768px?', options: ['@media (min-width: 768px)', '@media (max-width: 768px)', '@media (width: 768px)', '@media screen(768px)'], correctAnswer: 1, skill: 'CSS Responsive', difficulty: 'Medium', isChecked: true },
      { questionText: 'Sự khác biệt giữa display: none và visibility: hidden?', options: ['Không có khác biệt', 'visibility: hidden vẫn chiếm không gian layout', 'display: none vẫn hiển thị ở screen reader', 'Chỉ dùng được cho thẻ inline'], correctAnswer: 1, skill: 'CSS Layout', difficulty: 'Hard', isChecked: true },
      { questionText: 'Thuộc tính position: absolute định vị phần tử dựa vào đâu?', options: ['Màn hình trình duyệt', 'Phần tử cha gần nhất có position khác static', 'Dòng chảy tài liệu bình thường', 'Thẻ <body>'], correctAnswer: 1, skill: 'CSS Position', difficulty: 'Hard', isChecked: true },
      { questionText: 'Pseudo-class nào nhắm đến phần tử cuối cùng trong một danh sách?', options: ['::after', ':last-child', ':end', ':last-of-type'], correctAnswer: 1, skill: 'CSS Selectors', difficulty: 'Medium', isChecked: true },
      { questionText: 'Thẻ <img alt=""> trống mang ý nghĩa gì?', options: ['Lỗi HTML', 'Hình ảnh mang tính trang trí, Screen Reader có thể bỏ qua', 'Hình ảnh chưa load xong', 'Google sẽ phạt SEO'], correctAnswer: 1, skill: 'HTML Accessibility', difficulty: 'Hard', isChecked: true }
    ]
  },

  // ==========================================
  // BÀI 4: FREE - CƠ SỞ DỮ LIỆU & SQL
  // ==========================================
  {
    topicName: 'Cơ sở dữ liệu & SQL Cơ bản',
    description: 'Truy vấn SQL, các loại JOIN, đánh index và tối ưu CSDL quan hệ.',
    timeLimit: 20,
    level: 'free',
    status: 'PUBLISHED',
    createdBy: ADMIN_ID,
    questions: [
      { questionText: 'Lệnh SQL nào dùng để truy xuất dữ liệu từ database?', options: ['EXTRACT', 'OPEN', 'SELECT', 'GET'], correctAnswer: 2, skill: 'SQL DML', difficulty: 'Easy', isChecked: true },
      { questionText: 'Từ khóa nào dùng để lọc kết quả truy vấn?', options: ['FILTER', 'WHERE', 'ORDER BY', 'HAVING'], correctAnswer: 1, skill: 'SQL DML', difficulty: 'Easy', isChecked: true },
      { questionText: 'JOIN nào trả về tất cả các hàng khi có sự khớp trong một trong hai bảng?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], correctAnswer: 3, skill: 'SQL Joins', difficulty: 'Medium', isChecked: true },
      { questionText: 'Lệnh nào dùng để xóa toàn bộ dữ liệu trong bảng nhưng giữ lại cấu trúc bảng?', options: ['DELETE', 'DROP', 'TRUNCATE', 'REMOVE'], correctAnswer: 2, skill: 'SQL DDL', difficulty: 'Medium', isChecked: true },
      { questionText: 'Để sắp xếp kết quả giảm dần, ta dùng từ khóa nào?', options: ['ASC', 'DESC', 'DOWN', 'SORT -1'], correctAnswer: 1, skill: 'SQL Query', difficulty: 'Easy', isChecked: true },
      { questionText: 'Khóa chính (Primary Key) có đặc điểm gì?', options: ['Có thể chứa giá trị NULL', 'Phải duy nhất và không được NULL', 'Một bảng có thể có nhiều Khóa chính', 'Chỉ áp dụng cho dữ liệu số'], correctAnswer: 1, skill: 'Database Constraints', difficulty: 'Medium', isChecked: true },
      { questionText: 'Hàm nào đếm số lượng hàng trong một bảng?', options: ['SUM()', 'COUNT()', 'MAX()', 'TOTAL()'], correctAnswer: 1, skill: 'SQL Aggregation', difficulty: 'Easy', isChecked: true },
      { questionText: 'Sự khác biệt giữa HAVING và WHERE?', options: ['HAVING dùng cho hàm tập hợp (GROUP BY), WHERE dùng lọc từng hàng', 'WHERE chạy nhanh hơn HAVING', 'Không có khác biệt', 'HAVING chỉ dùng với JOIN'], correctAnswer: 0, skill: 'SQL Advanced', difficulty: 'Hard', isChecked: true },
      { questionText: 'Index trong Database dùng để làm gì?', options: ['Tiết kiệm dung lượng bộ nhớ', 'Tăng tốc độ truy vấn (SELECT)', 'Tăng tốc độ INSERT/UPDATE', 'Tạo khóa ngoại tự động'], correctAnswer: 1, skill: 'Database Optimization', difficulty: 'Hard', isChecked: true },
      { questionText: 'Lệnh nào tạo một bảng mới?', options: ['MAKE TABLE', 'CREATE TABLE', 'NEW TABLE', 'ADD TABLE'], correctAnswer: 1, skill: 'SQL DDL', difficulty: 'Easy', isChecked: true }
    ]
  },

  // ==========================================
  // BÀI 5: PAID - SYSTEM DESIGN & KIẾN TRÚC MỞ RỘNG
  // ==========================================
  {
    topicName: 'Thiết kế Hệ thống (System Design) - Premium',
    description: 'Chủ đề nâng cao về Microservices, Load Balancing, Caching, CAP Theorem và Message Queues.',
    timeLimit: 40,
    level: 'paid', // Đánh dấu Trả phí
    status: 'PUBLISHED',
    createdBy: ADMIN_ID,
    questions: [
      { questionText: 'Load Balancer (Bộ cân bằng tải) hoạt động như thế nào?', options: ['Lưu trữ cache dữ liệu', 'Phân phối traffic đồng đều đến nhiều server backend', 'Chặn các cuộc tấn công DDoS', 'Mã hóa database'], correctAnswer: 1, skill: 'System Design', difficulty: 'Medium', isChecked: true },
      { questionText: 'Trong định lý CAP (CAP Theorem), hệ thống phân tán không thể đáp ứng đồng thời cả 3 yếu tố nào?', options: ['Consistency, Availability, Partition Tolerance', 'Concurrency, Asynchrony, Performance', 'Caching, API, Processing', 'Control, Access, Provisioning'], correctAnswer: 0, skill: 'Distributed Systems', difficulty: 'Hard', isChecked: true },
      { questionText: 'Redis thường được sử dụng cho mục đích chính nào?', options: ['Lưu trữ file media (ảnh, video)', 'Database quan hệ chính', 'In-memory Caching', 'Phân tích Big Data'], correctAnswer: 2, skill: 'Caching', difficulty: 'Medium', isChecked: true },
      { questionText: 'Message Queue (RabbitMQ, Kafka) giúp giải quyết bài toán nào?', options: ['Xử lý bất đồng bộ, giảm tải cho API', 'Lưu trữ thông tin người dùng vĩnh viễn', 'Render giao diện Frontend', 'Thay thế Load Balancer'], correctAnswer: 0, skill: 'System Architecture', difficulty: 'Hard', isChecked: true },
      { questionText: 'Horizontal Scaling (Scale Out) nghĩa là gì?', options: ['Nâng cấp CPU, RAM cho server hiện tại', 'Thêm nhiều server mới vào hệ thống', 'Giảm số lượng database', 'Chuyển từ SQL sang NoSQL'], correctAnswer: 1, skill: 'Scalability', difficulty: 'Medium', isChecked: true },
      { questionText: 'Microservices architecture khác Monolithic ở điểm nào?', options: ['Dễ debug hơn', 'Chia nhỏ hệ thống thành các dịch vụ độc lập', 'Chạy tất cả code trên 1 tiến trình duy nhất', 'Luôn dùng chung 1 database duy nhất'], correctAnswer: 1, skill: 'Software Architecture', difficulty: 'Medium', isChecked: true },
      { questionText: 'Sharding trong Database là kỹ thuật gì?', options: ['Mã hóa password', 'Sao lưu dữ liệu', 'Chia nhỏ database ngang (Horizontal Partitioning) ra nhiều node', 'Nén dữ liệu'], correctAnswer: 2, skill: 'Database Scaling', difficulty: 'Hard', isChecked: true },
      { questionText: 'Cơ chế Rate Limiting dùng để làm gì?', options: ['Giới hạn số lượng request từ một user trong khoảng thời gian nhất định', 'Tăng tốc độ phản hồi API', 'Kiểm tra lỗi syntax của code', 'Cân bằng tải server'], correctAnswer: 0, skill: 'API Security', difficulty: 'Medium', isChecked: true },
      { questionText: 'Eventual Consistency (Nhất quán cuối cùng) thường thấy ở hệ thống nào?', options: ['Hệ thống tài chính ngân hàng', 'Hệ thống NoSQL phân tán (như Cassandra, DynamoDB)', 'Hệ thống SQL thuần túy (PostgreSQL)', 'Local storage trình duyệt'], correctAnswer: 1, skill: 'Distributed Databases', difficulty: 'Hard', isChecked: true },
      { questionText: 'Reverse Proxy (như Nginx) thường đặt ở vị trí nào trong kiến trúc?', options: ['Giữa Database và Backend', 'Trực tiếp bên trong trình duyệt User', 'Đứng trước Backend Server để nhận request từ Client', 'Trong Message Queue'], correctAnswer: 2, skill: 'Network Architecture', difficulty: 'Medium', isChecked: true }
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối MongoDB thành công...');

    // Tuỳ chọn: Xóa các topic cũ trước khi seed để tránh trùng lặp dữ liệu
    // await PracticeTopic.deleteMany({});
    // console.log('Đã dọn dẹp dữ liệu PracticeTopic cũ.');

    await PracticeTopic.insertMany(seedData);
    console.log('Seed dữ liệu 5 bài Practice Topics thành công!');
    
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedDB();