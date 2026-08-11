// เตรียม enrollment ก่อนส่งให้ Prisma (ใช้ร่วมกันทั้ง POST /api/students และ
// PUT /api/students/[id]):
//   - strip id/studentId (FK)/order เดิมทิ้ง แล้วบังคับ order ใหม่ตามตำแหน่ง
//     ใน array เสมอ — เพราะ enrollment ที่เพิ่มใหม่ (กด "+ เพิ่มสถาบัน") ไม่มี
//     order ติดมาเลย ถ้าปล่อยผ่านตรงๆ Prisma จะใช้ default(1) ชนกับสถาบันแรก
//     ที่มี order:1 อยู่แล้ว เกิด unique constraint (studentId, order) ชนกัน
//   - แปลง startDate/endDate เป็น Date object (endDate ว่าง = สถาบันปัจจุบัน
//     ยังไม่จบ/ยังไม่ย้ายออก)
export function prepEnrollments(enrollments) {
  return enrollments.map(({ id: _id, studentId: _sid, order: _order, startDate, endDate, ...e }, i) => ({
    ...e,
    order: i + 1,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
  }));
}
