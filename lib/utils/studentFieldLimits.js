// Mirrors the @db.VarChar(n) limits declared in prisma/schema.prisma for
// Student / StudentEnrollment. Used to catch "value too long for column"
// errors *before* they reach Prisma/Postgres, so admins get a clear message
// naming the exact field + row instead of an opaque 500 (Prisma's own
// error for this — P2000 — doesn't reliably report the column name here).
//
// Keep in sync with prisma/schema.prisma if those column sizes ever change.

export const STUDENT_ID_LIMIT = 20;

export const STUDENT_VARCHAR_LIMITS = {
  prefix: 20,
  prefixEn: 20,
  name: 100,
  nameEn: 100,
  lastname: 100,
  lastnameEn: 100,
  nickname: 50,
  gender: 20,
  nationalId: 20,
  passport: 20,
  militaryStatus: 50,
  tel: 20,
  email: 150,
  lineId: 100,
  country: 50,
  addrThHouseNo: 50,
  addrThSubdistrict: 100,
  addrThDistrict: 100,
  addrThProvince: 100,
  addrThPostalCode: 10,
  addrJpPostalCode: 10,
  addrJpPrefecture: 100,
  addrJpCity: 100,
  addrJpStreetAddress: 200,
  addrJpBuilding: 200,
  prevSchool: 200,
  scholarship: 100,
  scholarshipTypeId: 20,
  status: 30,
  avatar: 500,
  createdBy: 20,
  // note is unbounded Text — no limit
};

export const ENROLLMENT_VARCHAR_LIMITS = {
  university: 200,
  studentNo: 50,
  univEmail: 150,
  faculty: 100,
  department: 100,
  major: 100,
  year: 5,
  advisor: 100,
  // project is unbounded Text — no limit
};

/**
 * Scan `data` for string values that exceed the given field→maxLength map.
 * Returns [{ field, length, max }] for every offending field (empty array if none).
 */
export function findTooLongFields(data, limits) {
  const errors = [];
  if (!data) return errors;
  for (const [field, max] of Object.entries(limits)) {
    const val = data[field];
    if (typeof val === "string" && val.length > max) {
      errors.push({ field, length: val.length, max });
    }
  }
  return errors;
}

/** Human-readable Thai summary for a list of findTooLongFields() results. */
export function describeTooLongFields(errors) {
  return errors
    .map((e) => `${e.field} (${e.length}/${e.max} ตัวอักษร)`)
    .join(", ");
}
