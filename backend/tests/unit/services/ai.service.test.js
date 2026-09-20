jest.mock('@google/generative-ai');
jest.mock('openai');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiService = require('../../../services/ai.service');
const { job } = require('../../helpers/fixtures');

// genAI = new GoogleGenerativeAI(...) duoc khoi tao 1 lan o module-scope cua ai.service.js
const genAI = GoogleGenerativeAI.mock.instances[0];

function mockAiText(text) {
  genAI.getGenerativeModel.mockReturnValue({
    generateContent: jest.fn().mockResolvedValue({ response: { text: () => text } })
  });
}

function mockAiJson(obj) {
  mockAiText(JSON.stringify(obj));
}

function mockAiAlwaysFail(message = 'model overloaded') {
  genAI.getGenerativeModel.mockReturnValue({
    generateContent: jest.fn().mockRejectedValue(new Error(message))
  });
}

beforeEach(() => {
  genAI.getGenerativeModel.mockReset();
});

describe('ai.service.generateWithFallback', () => {
  test('UTC001 - model dau tien thanh cong, tra ve object JSON hop le -> parse dung', async () => {
    mockAiText('Day la ket qua: {"score": 90, "verdict": "Tot"} (het)');
    const result = await aiService.generateWithFallback('prompt', true);
    expect(result).toEqual({ score: 90, verdict: 'Tot' });
  });

  test('UTC002 - AI tra ve mang JSON boc trong ```json ... ``` -> tach dung mang', async () => {
    mockAiText('```json\n[{"a":1},{"a":2}]\n```');
    const result = await aiService.generateWithFallback('prompt', true);
    expect(result).toEqual([{ a: 1 }, { a: 2 }]);
  });

  test('UTC003 - isJson=false -> tra ve nguyen van text, khong parse', async () => {
    mockAiText('Day la cau tra loi dang van ban thuong.');
    const result = await aiService.generateWithFallback('prompt', false);
    expect(result).toBe('Day la cau tra loi dang van ban thuong.');
  });

  test('UTC004 - AI tra ve text khong phai JSON hop le trong che do isJson -> throw sau khi thu het models', async () => {
    mockAiText('day khong phai JSON gi ca');
    await expect(aiService.generateWithFallback('prompt', true)).rejects.toThrow('Tất cả models đều lỗi');
  });

  test('UTC005 - tat ca models deu that bai (vd het quota) -> throw kem thong tin loi cuoi cung', async () => {
    mockAiAlwaysFail('quota exceeded');
    await expect(aiService.generateWithFallback('prompt', true)).rejects.toThrow('quota exceeded');
  });
});

describe('ai.service.calculateJobMatch', () => {
  test('UTC006 - AI thanh cong -> tra ve dung cac truong score/verdict/pros/cons/advice', async () => {
    mockAiJson({ score: 75, verdict: 'Kha phu hop', pros: ['Gioi Node.js'], cons: ['Thieu kinh nghiem'], advice: 'Bo sung du an thuc te' });
    const result = await aiService.calculateJobMatch('CV text', 'JD text');
    expect(result).toEqual({ score: 75, verdict: 'Kha phu hop', pros: ['Gioi Node.js'], cons: ['Thieu kinh nghiem'], advice: 'Bo sung du an thuc te' });
  });

  test('UTC007 - AI loi hoan toan -> tra ve object mac dinh an toan, score=0', async () => {
    mockAiAlwaysFail('down');
    const result = await aiService.calculateJobMatch('CV text', 'JD text');
    expect(result.score).toBe(0);
    expect(result.verdict).toBe('Lỗi phân tích');
  });
});

describe('ai.service.evaluateCVMatch', () => {
  test('UTC008 - job khong co requirementCategories/requirements -> dung 4 dau muc mac dinh (40/30/20/10)', async () => {
    mockAiJson({
      verdict: 'Tot', reasonToHire: 'A', reasonToReject: 'B',
      categoryScores: [
        { name: 'Kỹ năng chuyên môn & Tech Stack cốt lõi', score: 100, feedback: 'x' },
        { name: 'Kinh nghiệm thực tế & Dự án đã làm', score: 100, feedback: 'x' },
        { name: 'Kiến thức nền tảng & Tư duy kỹ thuật', score: 100, feedback: 'x' },
        { name: 'Mức độ phù hợp với yêu cầu tuyển dụng', score: 100, feedback: 'x' }
      ],
      advice: 'ok'
    });
    const j = job({ requirementCategories: [], requirements: '' });
    const result = await aiService.evaluateCVMatch(j, 'CV text');

    expect(result.categoryScores).toHaveLength(4);
    expect(result.categoryScores.map(c => c.weight)).toEqual([40, 30, 20, 10]);
    expect(result.score).toBe(100);
  });

  test('UTC009 - AI cham 1 dau muc = 0, cac dau muc con lai 100 -> tong diem tru dung trong so dau muc do', async () => {
    mockAiJson({
      verdict: 'Can can nhac', reasonToHire: '', reasonToReject: '',
      categoryScores: [
        { name: 'Kỹ năng chuyên môn & Tech Stack cốt lõi', score: 0, feedback: 'thieu' },
        { name: 'Kinh nghiệm thực tế & Dự án đã làm', score: 100, feedback: 'x' },
        { name: 'Kiến thức nền tảng & Tư duy kỹ thuật', score: 100, feedback: 'x' },
        { name: 'Mức độ phù hợp với yêu cầu tuyển dụng', score: 100, feedback: 'x' }
      ],
      advice: ''
    });
    const j = job({ requirementCategories: [], requirements: '' });
    const result = await aiService.evaluateCVMatch(j, 'CV text');

    // Mat 40% trong so cua dau muc dau tien -> tong con lai 60
    expect(result.score).toBe(60);
  });

  test('UTC010 - AI bo sot mot dau muc trong ket qua -> dau muc do mac dinh score=0', async () => {
    mockAiJson({
      verdict: 'x', reasonToHire: '', reasonToReject: '',
      categoryScores: [
        { name: 'Kỹ năng chuyên môn & Tech Stack cốt lõi', score: 100, feedback: 'x' }
      ],
      advice: ''
    });
    const j = job({ requirementCategories: [], requirements: '' });
    const result = await aiService.evaluateCVMatch(j, 'CV text');

    const missing = result.categoryScores.find(c => c.name === 'Kinh nghiệm thực tế & Dự án đã làm');
    expect(missing.rawScore).toBe(0);
    expect(missing.feedback).toMatch(/Chưa có đủ thông tin/);
  });

  test('UTC011 - AI cham diem am hoac > 100 -> bi chan ve khoang 0-100', async () => {
    mockAiJson({
      verdict: 'x', reasonToHire: '', reasonToReject: '',
      categoryScores: [
        { name: 'Kỹ năng chuyên môn & Tech Stack cốt lõi', score: 150, feedback: 'x' },
        { name: 'Kinh nghiệm thực tế & Dự án đã làm', score: -20, feedback: 'x' },
        { name: 'Kiến thức nền tảng & Tư duy kỹ thuật', score: 50, feedback: 'x' },
        { name: 'Mức độ phù hợp với yêu cầu tuyển dụng', score: 50, feedback: 'x' }
      ],
      advice: ''
    });
    const j = job({ requirementCategories: [], requirements: '' });
    const result = await aiService.evaluateCVMatch(j, 'CV text');

    expect(result.categoryScores[0].rawScore).toBe(100);
    expect(result.categoryScores[1].rawScore).toBe(0);
  });

  test('UTC012 - job co requirementCategories voi tong trong so = 100 -> dung nguyen trong so do', async () => {
    const j = job({
      requirementCategories: [
        { name: 'React', weight: 60, isKey: true },
        { name: 'Testing', weight: 40, isKey: false }
      ]
    });
    mockAiJson({
      verdict: 'x', reasonToHire: '', reasonToReject: '',
      categoryScores: [
        { name: 'React', score: 80, feedback: 'x' },
        { name: 'Testing', score: 60, feedback: 'x' }
      ],
      advice: ''
    });
    const result = await aiService.evaluateCVMatch(j, 'CV text');

    expect(result.categoryScores.map(c => c.weight)).toEqual([60, 40]);
    // 80*0.6 + 60*0.4 = 48 + 24 = 72
    expect(result.score).toBe(72);
  });

  test('UTC013 - job co requirementCategories voi tong trong so khac 100 -> tu quy doi lai ty le', async () => {
    const j = job({
      requirementCategories: [
        { name: 'React', weight: 30, isKey: true },
        { name: 'Testing', weight: 30, isKey: false }
      ]
    });
    mockAiJson({
      verdict: 'x', reasonToHire: '', reasonToReject: '',
      categoryScores: [
        { name: 'React', score: 100, feedback: 'x' },
        { name: 'Testing', score: 100, feedback: 'x' }
      ],
      advice: ''
    });
    const result = await aiService.evaluateCVMatch(j, 'CV text');

    // 30/60=50%, 30/60=50% -> tong trong so quy doi = 100, diem = 100
    expect(result.categoryScores.reduce((s, c) => s + c.weight, 0)).toBe(100);
    expect(result.score).toBe(100);
  });

  test('UTC014 - AI loi hoan toan -> tra ve categoryScores voi rawScore/weightedScore = 0 cho tung dau muc', async () => {
    mockAiAlwaysFail('AI down');
    const j = job({ requirementCategories: [], requirements: '' });
    const result = await aiService.evaluateCVMatch(j, 'CV text');

    expect(result.score).toBe(0);
    expect(result.verdict).toBe('Lỗi Server');
    expect(result.categoryScores).toHaveLength(4);
    expect(result.categoryScores.every(c => c.rawScore === 0 && c.weightedScore === 0)).toBe(true);
  });
});

describe('ai.service.parseCVForTemplate', () => {
  test('UTC015 - AI tra ve thieu cac mang (education/experience/...) -> tu dien vao 1 phan tu rong', async () => {
    mockAiJson({
      personal: { fullName: 'Nguyen Van A', jobTitle: '', email: '', phone: '', dob: '', gender: '', address: '', link: '' },
      objective: '', skills: '', hobbies: ''
    });
    const result = await aiService.parseCVForTemplate('noi dung CV');

    expect(result.education).toEqual([{ school: '', major: '', time: '', description: '' }]);
    expect(result.experience).toEqual([{ company: '', position: '', time: '', description: '' }]);
    expect(result.activities).toEqual([{ organization: '', role: '', time: '', description: '' }]);
    expect(result.certificates).toEqual([{ name: '', time: '' }]);
  });

  test('UTC016 - AI loi hoan toan -> throw loi parse ke thua', async () => {
    mockAiAlwaysFail('gemini timeout');
    await expect(aiService.parseCVForTemplate('noi dung CV')).rejects.toThrow('Lỗi parse AI');
  });
});

describe('ai.service.generateQuestionsList', () => {
  test('UTC017 - AI tra ve mang cau hoi hop le -> giu nguyen mang do', async () => {
    mockAiJson(['Cau 1', 'Cau 2', 'Cau 3', 'Cau 4', 'Cau 5']);
    const result = await aiService.generateQuestionsList('Backend Developer');
    expect(result).toEqual(['Cau 1', 'Cau 2', 'Cau 3', 'Cau 4', 'Cau 5']);
  });

  test('UTC018 - AI loi hoac tra ve khong phai mang -> dung bo 5 cau hoi fallback mac dinh', async () => {
    mockAiJson({ notAnArray: true });
    const result = await aiService.generateQuestionsList('Backend Developer');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(5);
    expect(result[0]).toMatch(/Backend Developer/);
  });
});

describe('ai.service.conductMockInterview', () => {
  test('UTC019 - luot dau tien (history rong) -> tra ve feedback/nextQuestion/hint, isFinished=false', async () => {
    mockAiJson({ feedback: '', nextQuestion: 'Ban hay gioi thieu ban than?', hint: 'Noi ngan gon', isFinished: false });
    const result = await aiService.conductMockInterview([], { title: 'Backend Dev', company: 'Acme' }, { fullName: 'A', skills: ['Node.js'] });

    expect(result.nextQuestion).toBe('Ban hay gioi thieu ban than?');
    expect(result.isFinished).toBe(false);
    expect(result.fullText).toBe('Ban hay gioi thieu ban than?');
  });

  test('UTC020 - da qua 10 luot tra loi -> ep isFinished=true du AI khong tra ve', async () => {
    mockAiJson({ feedback: 'Tot', nextQuestion: 'Cam on ban', hint: '', isFinished: false });
    const history = Array.from({ length: 10 }, (_, i) => ({ role: 'user', content: `Tra loi ${i}` }));
    const result = await aiService.conductMockInterview(history, { title: 'Backend Dev' }, { fullName: 'A' });

    expect(result.isFinished).toBe(true);
    expect(result.fullText).toBe('Tot\n\nCam on ban');
  });

  test('UTC021 - AI loi hoan toan -> tra ve cau hoi fallback co nhac ten vi tri, khong throw', async () => {
    mockAiAlwaysFail('AI down');
    const result = await aiService.conductMockInterview([], { title: 'Backend Dev' }, { fullName: 'A' });

    expect(result.isFinished).toBe(false);
    expect(result.nextQuestion).toMatch(/Backend Dev/);
    expect(result.audioData).toBe('');
  });
});

describe('ai.service.evaluateInterview', () => {
  test('UTC022 - AI danh gia thanh cong -> tra ve dung cau truc score/matchRating/...', async () => {
    mockAiJson({
      score: 82, matchRating: 'Phu hop 82%', overview: 'Tot',
      strengths: ['Vung Node.js'], weaknesses: ['Thieu testing'], improvements: ['Hoc them Jest']
    });
    const result = await aiService.evaluateInterview(
      [{ role: 'user', content: 'Toi co 2 nam kinh nghiem Node.js' }],
      { title: 'Backend Dev' },
      { fullName: 'A', skills: ['Node.js'] }
    );
    expect(result.score).toBe(82);
    expect(result.strengths).toEqual(['Vung Node.js']);
  });

  test('UTC023 - AI loi hoan toan -> tra ve ket qua mac dinh voi score=0', async () => {
    mockAiAlwaysFail('AI down');
    const result = await aiService.evaluateInterview([{ role: 'user', content: 'x' }], { title: 'Backend Dev' }, { fullName: 'A' });
    expect(result.score).toBe(0);
    expect(result.weaknesses).toContain('Chưa có dữ liệu do lỗi mạng');
  });
});
