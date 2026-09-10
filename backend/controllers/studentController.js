import Student from "../models/studentModel.js";
import { User } from "../models/userModel.js";
import { createHistoryLog } from "../utils/createHistoryLog.js";
import { mapRoleForHistory } from "../utils/roleMapper.js";
import bcrypt from "bcryptjs";

/* =========================================================
   HELPER: CREATE / SYNC STUDENT USER ACCOUNT
========================================================= */

const createOrUpdateStudentUser = async ({
  studentId,
  firstName,
  middleName,
  lastName,
  email,
  profilePhoto = "",
}) => {
  if (!studentId) {
    throw new Error("Student ID is required to create a User account.");
  }

  const normalizedStudentId = String(studentId).trim();

  const normalizedEmail = email
    ? String(email).trim().toLowerCase()
    : `${normalizedStudentId.toLowerCase()}@student.eduguard.local`;

  const fullName = `${firstName || ""} ${
    middleName ? middleName + " " : ""
  }${lastName || ""}`.trim();

  /*
   * =======================================================
   * FIND EXISTING USER
   *
   * We primarily identify student accounts using studentId.
   * Email is also checked to prevent duplicate emails.
   * =======================================================
   */

  let user = await User.findOne({
    studentId: normalizedStudentId,
    role: "student",
  });

  /*
   * If there is no User by studentId, check email.
   * This is useful for students that may have been created
   * previously through the signup system.
   */

  if (!user && email) {
    user = await User.findOne({
      email: normalizedEmail,
    });

    /*
     * Only use an email-matched account if it is a student.
     *
     * This prevents accidentally changing an admin or teacher
     * account just because the email matches.
     */

    if (user && user.role !== "student") {
      throw new Error(
        `Email ${normalizedEmail} is already being used by a ${user.role} account.`
      );
    }
  }

  /*
   * =======================================================
   * UPDATE EXISTING USER
   * =======================================================
   */

  if (user) {
    user.firstName = firstName || "";
    user.middleName = middleName || "";
    user.lastName = lastName || "";
    user.name = fullName;
    user.email = normalizedEmail;
    user.studentId = normalizedStudentId;
    user.role = "student";

    if (profilePhoto) {
      user.profilePhoto = profilePhoto;
    }

    /*
     * Admin-created accounts are already verified.
     *
     * Do not change an already-created account's password.
     */

    user.isVerified = true;

    await user.save();

    console.log(
      `✅ Student User synchronized: ${normalizedStudentId}`
    );

    return {
      user,
      created: false,
    };
  }

  /*
   * =======================================================
   * CREATE NEW USER
   * =======================================================
   *
   * Initial password = Student ID.
   *
   * Example:
   * Student ID: 2026-001
   * Password: 2026-001
   *
   * It is hashed before being stored.
   * =======================================================
   */

  const initialPassword = normalizedStudentId;

  const hashedPassword = await bcrypt.hash(
    initialPassword,
    10
  );

  user = new User({
    firstName: firstName || "",
    middleName: middleName || "",
    lastName: lastName || "",

    name:
      fullName ||
      normalizedStudentId,

    email: normalizedEmail,

    password: hashedPassword,

    role: "student",

    studentId: normalizedStudentId,

    profilePhoto:
      profilePhoto ||
      "https://ui-avatars.com/api/?name=Student&background=random",

    /*
     * Admin-created accounts do not need signup email
     * verification.
     */

    isVerified: true,
  });

  await user.save();

  console.log(
    `✅ Student User account created: ${normalizedStudentId}`
  );

  return {
    user,
    created: true,
  };
};


/* =========================================================
   GET ALL STUDENTS
========================================================= */

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch students",
    });
  }
};


/* =========================================================
   GET STUDENT BY STUDENT ID
========================================================= */

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({
      studentId: id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error("GET STUDENT ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};


/* =========================================================
   CREATE STUDENT
========================================================= */

export const createStudent = async (req, res) => {
  try {
    /*
     * =====================================================
     * CURRENT ADMIN
     * =====================================================
     */

    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found.",
      });
    }

    /*
     * =====================================================
     * PROFILE PHOTO
     * =====================================================
     */

    const profilePhoto = req.file
      ? req.file.path
      : req.body.profilePhoto || "";

    /*
     * =====================================================
     * NORMALIZE DATA
     * =====================================================
     */

    const studentId = req.body.studentId?.trim();

    const firstName = req.body.firstName?.trim();

    const middleName =
      req.body.middleName?.trim() || "";

    const lastName = req.body.lastName?.trim();

    const email =
      req.body.email?.trim().toLowerCase() || "";

    /*
     * =====================================================
     * BASIC VALIDATION
     * =====================================================
     */

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required.",
      });
    }

    if (!firstName) {
      return res.status(400).json({
        success: false,
        message: "First name is required.",
      });
    }

    if (!lastName) {
      return res.status(400).json({
        success: false,
        message: "Last name is required.",
      });
    }

    /*
     * =====================================================
     * CHECK DUPLICATE STUDENT
     * =====================================================
     */

    const existingStudent = await Student.findOne({
      studentId,
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "A student with this Student ID already exists.",
      });
    }

    /*
     * =====================================================
     * CHECK EMAIL
     * =====================================================
     *
     * Your User model requires email to be unique.
     *
     * If no email is supplied, createStudentUser() creates
     * a unique internal student email.
     * =====================================================
     */

    if (email) {
      const existingEmailUser = await User.findOne({
        email,
      });

      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message:
            "This email address is already registered to a User account.",
        });
      }
    }

    /*
     * =====================================================
     * CREATE STUDENT
     * =====================================================
     */

    const student = new Student({
      ...req.body,

      studentId,
      firstName,
      middleName,
      lastName,
      email,

      profilePhoto,

      createdBy: req.userId,
    });

    await student.save();

    /*
     * =====================================================
     * CREATE USER ACCOUNT
     * =====================================================
     */

    try {
      await createOrUpdateStudentUser({
        studentId,
        firstName,
        middleName,
        lastName,
        email,
        profilePhoto,
      });
    } catch (userError) {
      /*
       * If User creation fails, remove the Student record
       * so we don't end up with a Student without a User.
       */

      await Student.findByIdAndDelete(student._id);

      console.error(
        "CREATE STUDENT USER ERROR:",
        userError
      );

      return res.status(400).json({
        success: false,
        message:
          userError.message ||
          "Failed to create student User account.",
      });
    }

    /*
     * =====================================================
     * HISTORY LOG
     * =====================================================
     */

    await createHistoryLog({
      userId: currentUser._id,
      role: mapRoleForHistory(currentUser.role),
      action: "Create Student",
      category: "Student",
      details: `Student created: ${student.studentId}`,
      ipAddress: req.ip,
    });

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return res.status(201).json({
      success: true,
      message:
        "Student and User account created successfully.",
      student,
    });
  } catch (error) {
    console.error(
      "CREATE STUDENT ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create student.",
    });
  }
};


/* =========================================================
   UPDATE STUDENT
========================================================= */

export const updateStudent = async (req, res) => {
  try {
    /*
     * =====================================================
     * CURRENT USER
     * =====================================================
     */

    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      return res.status(404).json({
        message: "Current user not found",
      });
    }

    /*
     * =====================================================
     * FIND STUDENT
     * =====================================================
     */

    const studentId = req.params.id;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    /*
     * =====================================================
     * ORIGINAL STUDENT ID
     * =====================================================
     */

    const originalStudentId = student.studentId;

    /*
     * =====================================================
     * PROFILE PHOTO
     * =====================================================
     */

    let profilePhoto = student.profilePhoto;

    if (req.file) {
      profilePhoto = req.file.path;

      console.log(
        "📸 NEW PROFILE PHOTO:",
        profilePhoto
      );
    } else if (req.body.profilePhoto) {
      profilePhoto = req.body.profilePhoto;
    }

    /*
     * =====================================================
     * NORMALIZE FIELDS
     * =====================================================
     */

    const newStudentId =
      req.body.studentId?.trim() ||
      student.studentId;

    const firstName =
      req.body.firstName?.trim() ||
      student.firstName;

    const middleName =
      req.body.middleName?.trim() ||
      "";

    const lastName =
      req.body.lastName?.trim() ||
      student.lastName;

    const email =
      req.body.email !== undefined
        ? req.body.email.trim().toLowerCase()
        : student.email || "";

    /*
     * =====================================================
     * CHECK STUDENT ID CHANGE
     * =====================================================
     */

    if (newStudentId !== originalStudentId) {
      const duplicateStudent = await Student.findOne({
        studentId: newStudentId,
        _id: { $ne: student._id },
      });

      if (duplicateStudent) {
        return res.status(400).json({
          message:
            "Another student already uses this Student ID.",
        });
      }
    }

    /*
     * =====================================================
     * CHECK EMAIL DUPLICATE
     * =====================================================
     */

    if (email) {
      const duplicateEmailUser = await User.findOne({
        email,
        _id: {
          $ne:
            (
              await User.findOne({
                studentId: originalStudentId,
                role: "student",
              })
            )?._id,
        },
      });

      if (duplicateEmailUser) {
        return res.status(400).json({
          message:
            "This email address is already being used by another account.",
        });
      }
    }

    /*
     * =====================================================
     * UPDATE STUDENT
     * =====================================================
     */

    const updatedData = {
      ...req.body,

      studentId: newStudentId,
      firstName,
      middleName,
      lastName,
      email,

      profilePhoto,
    };

    const updatedStudent =
      await Student.findByIdAndUpdate(
        studentId,
        updatedData,
        {
          new: true,
          runValidators: true,
        }
      );

    /*
     * =====================================================
     * FIND CORRESPONDING USER
     * =====================================================
     *
     * First search using the OLD student ID because the
     * Student ID may have just been changed.
     * =====================================================
     */

    let studentUser = await User.findOne({
      studentId: originalStudentId,
      role: "student",
    });

    /*
     * If there is no User yet, create one.
     *
     * This also repairs older students that existed before
     * the User-account synchronization feature was added.
     */

    if (!studentUser) {
      const result =
        await createOrUpdateStudentUser({
          studentId: newStudentId,
          firstName,
          middleName,
          lastName,
          email,
          profilePhoto,
        });

      studentUser = result.user;
    } else {
      /*
       * ===================================================
       * SYNCHRONIZE USER
       * ===================================================
       */

      studentUser.firstName = firstName;
      studentUser.middleName = middleName;
      studentUser.lastName = lastName;

      studentUser.name =
        `${firstName} ${
          middleName ? middleName + " " : ""
        }${lastName}`.trim();

      studentUser.email = email;
      studentUser.studentId = newStudentId;

      if (profilePhoto) {
        studentUser.profilePhoto =
          profilePhoto;
      }

      studentUser.isVerified = true;

      await studentUser.save();

      console.log(
        "✅ USER ACCOUNT SYNCHRONIZED:",
        studentUser.studentId
      );
    }

    /*
     * =====================================================
     * HISTORY LOG
     * =====================================================
     */

    await createHistoryLog({
      userId: currentUser._id,
      role: mapRoleForHistory(currentUser.role),
      action: "Update Student Details",
      category: "Student",
      details:
        `Student details updated: ` +
        `(Student ID: ${newStudentId})`,
      ipAddress: req.ip,
    });

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return res.status(200).json({
      success: true,
      message:
        "Student and User account updated successfully.",
      student: updatedStudent,
      profilePhoto,
    });
  } catch (error) {
    console.error(
      "FAILED TO UPDATE STUDENT:",
      error
    );

    return res.status(400).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
};


/* =========================================================
   UPDATE MY PROFILE
========================================================= */

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      firstName,
      middleName,
      lastName,
      phone,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message:
          "Only students can update their profile.",
      });
    }

    const student = await Student.findOne({
      studentId: user.studentId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student record not found.",
      });
    }

    if (!firstName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name is required.",
      });
    }

    if (!lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Last name is required.",
      });
    }

    student.firstName = firstName.trim();

    student.middleName =
      middleName?.trim() || "";

    student.lastName =
      lastName.trim();

    student.phone =
      phone?.trim() || "";

    await student.save();

    /*
     * Also synchronize the User account.
     */

    user.firstName =
      firstName.trim();

    user.middleName =
      middleName?.trim() || "";

    user.lastName =
      lastName.trim();

    user.name =
      `${firstName.trim()} ${
        middleName?.trim()
          ? middleName.trim() + " "
          : ""
      }${lastName.trim()}`;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",

      student: {
        _id: student._id,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        studentId: student.studentId,
        grade: student.grade,
        email: student.email,
        phone: student.phone,
        profilePhoto:
          student.profilePhoto,
        riskLevel: student.riskLevel,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE MY PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update profile.",
      error: error.message,
    });
  }
};


/* =========================================================
   UPDATE MY PROFILE PHOTO
========================================================= */

export const updateMyProfilePhoto = async (
  req,
  res
) => {
  try {
    const userId = req.user._id;

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message:
          "Only students can update their profile photo.",
      });
    }

    const student =
      await Student.findOne({
        studentId: user.studentId,
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student record not found.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Profile photo is required.",
      });
    }

    student.profilePhoto =
      req.file.path;

    await student.save();

    /*
     * Keep User profile photo synchronized.
     */

    user.profilePhoto =
      student.profilePhoto;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Profile photo updated successfully.",
      profilePhoto:
        student.profilePhoto,
    });
  } catch (error) {
    console.error(
      "UPDATE STUDENT PROFILE PHOTO ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update profile photo.",
      error: error.message,
    });
  }
};


/* =========================================================
   BULK CREATE / UPDATE STUDENTS
========================================================= */

export const createStudentsBulk = async (
  req,
  res
) => {
  console.log("🔥 BULK ROUTE HIT");
  console.log("REQ BODY:", req.body);

  try {
    const currentUser =
      await User.findById(req.userId);

    if (!currentUser) {
      return res.status(404).json({
        message:
          "Current user not found.",
      });
    }

    const students = req.body;

    if (
      !Array.isArray(students) ||
      students.length === 0
    ) {
      return res.status(400).json({
        message:
          "Invalid student data",
      });
    }

    let inserted = 0;
    let updated = 0;
    let invalid = 0;

    const errors = [];

    const gradeMap = {
      "Grade 10": "Grade 11",
      "Grade 11": "Grade 12",
      "Grade 12": "Grade 12",
      Grade12: "Graduated",
    };

    /*
     * =====================================================
     * PROCESS EACH STUDENT
     * =====================================================
     */

    for (const s of students) {
      try {
        if (!s.studentId) {
          invalid++;
          errors.push({
            studentId: null,
            reason:
              "Missing studentId",
          });
          continue;
        }

        const normalizedStudentId =
          String(s.studentId).trim();

        /*
         * =================================================
         * FIND EXISTING STUDENT
         * =================================================
         */

        const existing =
          await Student.findOne({
            studentId:
              normalizedStudentId,
          });

        /*
         * =================================================
         * UPDATE EXISTING STUDENT
         * =================================================
         */

        if (existing) {
          const newGrade =
            gradeMap[
              s.grade || existing.grade
            ] ||
            existing.grade;

          const updatedStudent =
            await Student.findOneAndUpdate(
              {
                studentId:
                  normalizedStudentId,
              },
              {
                $set: {
                  ...(s.firstName && {
                    firstName:
                      s.firstName,
                  }),

                  ...(s.lastName && {
                    lastName:
                      s.lastName,
                  }),

                  ...(s.middleName && {
                    middleName:
                      s.middleName,
                  }),

                  ...(s.email && {
                    email:
                      s.email
                        .trim()
                        .toLowerCase(),
                  }),

                  ...(s.phone && {
                    phone:
                      s.phone,
                  }),

                  ...(s.gender && {
                    gender:
                      s.gender,
                  }),

                  ...(s.riskLevel && {
                    riskLevel:
                      s.riskLevel,
                  }),

                  grade: newGrade,
                },
              },
              {
                new: true,
                runValidators: true,
              }
            );

          /*
           * ===============================================
           * SYNCHRONIZE USER
           * ===============================================
           */

          if (updatedStudent) {
            const studentEmail =
              updatedStudent.email
                ?.trim()
                .toLowerCase() ||
              "";

            try {
              await createOrUpdateStudentUser(
                {
                  studentId:
                    updatedStudent.studentId,

                  firstName:
                    updatedStudent.firstName,

                  middleName:
                    updatedStudent.middleName,

                  lastName:
                    updatedStudent.lastName,

                  email:
                    studentEmail,

                  profilePhoto:
                    updatedStudent.profilePhoto ||
                    "",
                }
              );
            } catch (userError) {
              console.error(
                `USER SYNC ERROR (${normalizedStudentId}):`,
                userError
              );

              errors.push({
                studentId:
                  normalizedStudentId,
                reason:
                  userError.message,
              });
            }

            updated++;
          }

          continue;
        }

        /*
         * =================================================
         * INSERT VALIDATION
         * =================================================
         */

        if (
          !s.firstName ||
          !s.lastName ||
          !s.gender
        ) {
          invalid++;

          errors.push({
            studentId:
              normalizedStudentId,
            reason:
              "Missing firstName, lastName, or gender",
          });

          continue;
        }

        /*
         * =================================================
         * NORMALIZE EMAIL
         * =================================================
         */

        const studentEmail =
          s.email
            ? String(s.email)
                .trim()
                .toLowerCase()
            : "";

        /*
         * =================================================
         * CREATE STUDENT
         * =================================================
         */

        const newStudent =
          await Student.create({
            studentId:
              normalizedStudentId,

            firstName:
              s.firstName.trim(),

            lastName:
              s.lastName.trim(),

            middleName:
              s.middleName?.trim() || "",

            email:
              studentEmail,

            phone:
              s.phone || "",

            gender:
              s.gender,

            grade:
              s.grade ||
              "Grade 10",

            riskLevel:
              s.riskLevel ||
              "Low",

            createdBy:
              req.userId,
          });

        /*
         * =================================================
         * CREATE USER
         * =================================================
         */

        try {
          await createOrUpdateStudentUser({
            studentId:
              normalizedStudentId,

            firstName:
              newStudent.firstName,

            middleName:
              newStudent.middleName,

            lastName:
              newStudent.lastName,

            email:
              newStudent.email,

            profilePhoto:
              newStudent.profilePhoto ||
              "",
          });
        } catch (userError) {
          /*
           * Roll back Student if User creation fails.
           */

          await Student.findByIdAndDelete(
            newStudent._id
          );

          throw userError;
        }

        inserted++;
      } catch (studentError) {
        console.error(
          `❌ BULK STUDENT ERROR:`,
          studentError
        );

        invalid++;

        errors.push({
          studentId:
            s.studentId || null,
          reason:
            studentError.message ||
            "Failed to process student",
        });
      }
    }

    console.log(
      "📊 FINAL RESULT:",
      {
        inserted,
        updated,
        invalid,
      }
    );

    /*
     * =====================================================
     * HISTORY LOG
     * =====================================================
     */

    await createHistoryLog({
      userId:
        currentUser._id,

      role:
        mapRoleForHistory(
          currentUser.role
        ),

      action:
        "Bulk Upsert Students",

      category:
        "Student",

      details:
        `Inserted: ${inserted}, Updated: ${updated}, Invalid: ${invalid}`,

      ipAddress:
        req.ip,
    });

    return res.status(200).json({
      success: true,
      message:
        "Bulk upsert completed",

      inserted,
      updated,
      invalid,

      errors,
    });
  } catch (error) {
    console.error(
      "BULK UPSERT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed bulk upsert",
      error:
        error.message,
    });
  }
};


/* =========================================================
   PREVIEW BULK STUDENTS
========================================================= */

export const previewBulkStudents = async (
  req,
  res
) => {
  try {
    const students = req.body;

    if (!Array.isArray(students)) {
      return res.status(400).json({
        message:
          "Invalid data format",
      });
    }

    const result = {
      toInsert: [],
      toUpdate: [],
      invalid: [],
    };

    for (const s of students) {
      if (!s.studentId) {
        result.invalid.push({
          data: s,
          reason:
            "Missing studentId",
        });

        continue;
      }

      const existing =
        await Student.findOne({
          studentId:
            String(s.studentId).trim(),
        });

      if (existing) {
        result.toUpdate.push({
          studentId:
            s.studentId,

          name:
            `${existing.firstName} ${existing.lastName}`,

          oldGrade:
            existing.grade,

          newGrade:
            s.grade,

          email:
            s.email,

          phone:
            s.phone,
        });
      } else {
        result.toInsert.push({
          studentId:
            s.studentId,

          name:
            `${s.firstName || ""} ${
              s.lastName || ""
            }`.trim(),

          grade:
            s.grade,

          email:
            s.email,

          phone:
            s.phone,

          /*
           * Keep these available for the frontend
           * if you decide to display them later.
           */

          firstName:
            s.firstName || "",

          middleName:
            s.middleName || "",

          lastName:
            s.lastName || "",

          gender:
            s.gender || "Male",
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error(
      "PREVIEW BULK ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Preview failed",
    });
  }
};


/* =========================================================
   GET STUDENT TIMELINE
========================================================= */

export const getStudentTimeline = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    /*
     * NOTE:
     * Keep your existing imports for Report,
     * Incident, Case, and Intervention above this
     * controller if they already exist in your actual file.
     */

    const [
      reports,
      incidents,
      cases,
      interventions,
    ] = await Promise.all([
      Report.find({
        studentId: id,
      }),

      Incident.find({
        studentId: id,
      }),

      Case.find({
        studentId: id,
      }),

      Intervention.find({
        studentId: id,
      }),
    ]);

    const timeline = [
      ...reports.map((r) => ({
        type: "REPORT",
        date: r.createdAt,
        data: r,
      })),

      ...incidents.map((i) => ({
        type: "INCIDENT",
        date: i.createdAt,
        data: i,
      })),

      ...cases.map((c) => ({
        type: "CASE",
        date: c.createdAt,
        data: c,
      })),

      ...interventions.map((i) => ({
        type: "INTERVENTION",
        date: i.createdAt,
        data: i,
      })),
    ];

    timeline.sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );

    res.json(timeline);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   DELETE STUDENT
========================================================= */

export const deleteStudent = async (
  req,
  res
) => {
  try {
    const currentUser =
      await User.findById(req.userId);

    if (!currentUser) {
      return res.status(404).json({
        message:
          "Current user not found.",
      });
    }

    /*
     * Find student first so we know the studentId.
     */

    const student =
      await Student.findById(
        req.params.id
      );

    if (!student) {
      return res.status(404).json({
        message:
          "Student not found",
      });
    }

    /*
     * Delete Student.
     */

    await Student.findByIdAndDelete(
      req.params.id
    );

    /*
     * Delete corresponding student User.
     */

    const deletedUser =
      await User.findOneAndDelete({
        studentId:
          student.studentId,
        role: "student",
      });

    if (deletedUser) {
      console.log(
        `🗑️ Student User deleted: ${student.studentId}`
      );
    } else {
      console.warn(
        `⚠️ No User account found for studentId: ${student.studentId}`
      );
    }

    /*
     * History log.
     */

    await createHistoryLog({
      userId:
        currentUser._id,

      role:
        mapRoleForHistory(
          currentUser.role
        ),

      action:
        "Delete Student",

      category:
        "Student",

      details:
        `Student deleted: (Student ID: ${student.studentId})`,

      ipAddress:
        req.ip,
    });

    return res.status(200).json({
      success: true,
      message:
        "Student and User account deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE STUDENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete student",
      error:
        error.message,
    });
  }
};


/* =========================================================
   SEARCH STUDENTS
========================================================= */

export const searchStudents = async (
  req,
  res
) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json([]);
    }

    let excludeStudentId = null;

    /*
     * Find current student's Student record.
     */

    if (req.userId) {
      const currentUser =
        await User.findById(
          req.userId
        );

      if (
        currentUser?.role ===
          "student" &&
        currentUser.studentId
      ) {
        const currentStudent =
          await Student.findOne({
            studentId:
              currentUser.studentId,
          });

        if (currentStudent) {
          excludeStudentId =
            currentStudent._id;
        }
      }
    }

    const searchFilter = {
      $or: [
        {
          firstName: {
            $regex: query,
            $options: "i",
          },
        },

        {
          lastName: {
            $regex: query,
            $options: "i",
          },
        },

        {
          email: {
            $regex: query,
            $options: "i",
          },
        },
      ],
    };

    if (excludeStudentId) {
      searchFilter._id = {
        $ne: excludeStudentId,
      };
    }

    const students =
      await Student.find(
        searchFilter
      )
        .select(
          "_id firstName lastName email studentId"
        )
        .limit(10);

    res.json(students);
  } catch (error) {
    console.error(
      "SEARCH STUDENTS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};