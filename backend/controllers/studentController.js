import Student from "../models/studentModel.js";
import { User } from "../models/userModel.js";

import Report from "../models/reportModel.js";
import Incident from "../models/incidentModel.js";
import Case from "../models/Case.js";
import Intervention from "../models/interventionModel.js";

import { createHistoryLog } from "../utils/createHistoryLog.js";
import { mapRoleForHistory } from "../utils/roleMapper.js";

import bcrypt from "bcryptjs";

import { sendStudentWelcomeEmail } from "../mailer/emails.js";

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
    throw new Error(
      "Student ID is required to create a User account."
    );
  }

  const normalizedStudentId =
    String(studentId).trim();

  const normalizedEmail = email
    ? String(email).trim().toLowerCase()
    : `${normalizedStudentId.toLowerCase()}@student.eduguard.local`;

  const fullName =
    `${firstName || ""} ${
      middleName ? middleName + " " : ""
    }${lastName || ""}`.trim();

  /* =======================================================
     FIND EXISTING USER
  ======================================================= */

  let user = await User.findOne({
    studentId: normalizedStudentId,
    role: "student",
  });

  /*
   * If there is no User by studentId, check email.
   */

  if (!user && email) {
    user = await User.findOne({
      email: normalizedEmail,
    });

    /*
     * Only use an email-matched account if it is a student.
     */

    if (user && user.role !== "student") {
      throw new Error(
        `Email ${normalizedEmail} is already being used by a ${user.role} account.`
      );
    }
  }

  /* =======================================================
     UPDATE EXISTING USER
  ======================================================= */

  if (user) {
    user.firstName =
      firstName || "";

    user.middleName =
      middleName || "";

    user.lastName =
      lastName || "";

    user.name =
      fullName;

    user.email =
      normalizedEmail;

    user.studentId =
      normalizedStudentId;

    user.role =
      "student";

    if (profilePhoto) {
      user.profilePhoto =
        profilePhoto;
    }

    /*
     * Admin-created accounts are already verified.
     *
     * IMPORTANT:
     * Do NOT change the existing password.
     *
     * This is also why we do not send a welcome email
     * when an existing account is synchronized.
     */

    user.isVerified =
      true;

    await user.save();

    console.log(
      `✅ Student User synchronized: ${normalizedStudentId}`
    );

    return {
      user,
      created: false,
      initialPassword: null,
    };
  }

  /* =======================================================
     CREATE NEW USER
  =======================================================

     Initial password = Student ID.

     Example:

     Student ID: 2026-001
     Password:   2026-001

     The password is hashed before being stored.
  ======================================================= */

  const initialPassword =
  `${lastName || ""}${firstName || ""}${normalizedStudentId}`
    .replace(/\s+/g, "")
    .toLowerCase();

  const hashedPassword =
    await bcrypt.hash(
      initialPassword,
      10
    );

  user = new User({
    firstName:
      firstName || "",

    middleName:
      middleName || "",

    lastName:
      lastName || "",

    name:
      fullName ||
      normalizedStudentId,

    email:
      normalizedEmail,

    password:
      hashedPassword,

    role:
      "student",

    studentId:
      normalizedStudentId,

    profilePhoto:
      profilePhoto ||
      "https://ui-avatars.com/api/?name=Student&background=random",

    /*
     * Admin-created accounts do not need signup
     * email verification.
     */

    isVerified:
      true,
  });

  await user.save();

  console.log(
    `✅ Student User account created: ${normalizedStudentId}`
  );

  return {
    user,
    created: true,

    /*
     * IMPORTANT:
     * This is returned ONLY in memory so it can be
     * sent through the welcome email.
     *
     * The database only contains the hashed password.
     */

    initialPassword,
  };
};


/* =========================================================
   GET ALL STUDENTS
========================================================= */

export const getStudents = async (
  req,
  res
) => {
  try {
    const students =
      await Student.find()
        .sort({
          createdAt: -1,
        });

    return res.status(200).json(
      students
    );
  } catch (error) {
    console.error(
      "GET STUDENTS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch students",
    });
  }
};


/* =========================================================
   GET STUDENT BY STUDENT ID
========================================================= */

export const getStudentById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const student =
      await Student.findOne({
        studentId: id,
      });

    if (!student) {
      return res.status(404).json({
        message:
          "Student not found",
      });
    }

    return res.status(200).json(
      student
    );
  } catch (error) {
    console.error(
      "GET STUDENT ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};


/* =========================================================
   CREATE STUDENT
========================================================= */

export const createStudent = async (
  req,
  res
) => {
  try {
    /* =====================================================
       CURRENT ADMIN
    ===================================================== */

    const currentUser =
      await User.findById(
        req.userId
      );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message:
          "Current user not found.",
      });
    }

    /* =====================================================
       PROFILE PHOTO
    ===================================================== */

    const profilePhoto =
      req.file
        ? req.file.path
        : req.body.profilePhoto || "";

    /* =====================================================
       NORMALIZE DATA
    ===================================================== */

    const studentId =
      req.body.studentId?.trim();

    const firstName =
      req.body.firstName?.trim();

    const middleName =
      req.body.middleName?.trim() || "";

    const lastName =
      req.body.lastName?.trim();

    const email =
      req.body.email
        ?.trim()
        .toLowerCase() || "";

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message:
          "Student ID is required.",
      });
    }

    if (!firstName) {
      return res.status(400).json({
        success: false,
        message:
          "First name is required.",
      });
    }

    if (!lastName) {
      return res.status(400).json({
        success: false,
        message:
          "Last name is required.",
      });
    }

    /* =====================================================
       CHECK DUPLICATE STUDENT
    ===================================================== */

    const existingStudent =
      await Student.findOne({
        studentId,
      });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message:
          "A student with this Student ID already exists.",
      });
    }

    /* =====================================================
       CHECK EMAIL
    ===================================================== */

    if (email) {
      const existingEmailUser =
        await User.findOne({
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

    /* =====================================================
       CREATE STUDENT
    ===================================================== */

    const student =
      new Student({
        ...req.body,

        studentId,

        firstName,

        middleName,

        lastName,

        email,

        profilePhoto,

        createdBy:
          req.userId,
      });

    await student.save();

    /* =====================================================
       CREATE USER ACCOUNT
    ===================================================== */

    let userResult;

    try {
      userResult =
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

      await Student.findByIdAndDelete(
        student._id
      );

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

    /* =====================================================
       SEND STUDENT WELCOME EMAIL
    ===================================================== */

    let emailSent = false;
    let emailFailed = false;

    /*
     * Only send an email when:
     *
     * 1. A NEW User account was created
     * 2. The student has a real email address
     *
     * Existing accounts are NOT emailed.
     */

    if (
      userResult.created &&
      email
    ) {
      try {
        await sendStudentWelcomeEmail({
          email,

          firstName,

          studentId,

          password:
            userResult.initialPassword,
        });

        emailSent = true;

        console.log(
          `📧 Welcome email sent to ${email}`
        );
      } catch (emailError) {
        emailFailed = true;

        /*
         * IMPORTANT:
         * Do NOT delete the student/user account
         * if only the email failed.
         */

        console.error(
          `⚠️ Student account created, but welcome email failed (${email}):`,
          emailError
        );
      }
    }

    /* =====================================================
       HISTORY LOG
    ===================================================== */

    await createHistoryLog({
      userId:
        currentUser._id,

      role:
        mapRoleForHistory(
          currentUser.role
        ),

      action:
        "Create Student",

      category:
        "Student",

      details:
        `Student created: ${student.studentId}`,

      ipAddress:
        req.ip,
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      success: true,

      message:
        emailSent
          ? "Student and User account created successfully. Login credentials were sent to the student's email."
          : emailFailed
          ? "Student and User account created successfully, but the welcome email could not be sent."
          : "Student and User account created successfully.",

      student,

      emailSent,

      emailFailed,
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

export const updateStudent = async (
  req,
  res
) => {
  try {
    /* =====================================================
       CURRENT USER
    ===================================================== */

    const currentUser =
      await User.findById(
        req.userId
      );

    if (!currentUser) {
      return res.status(404).json({
        message:
          "Current user not found",
      });
    }

    /* =====================================================
       FIND STUDENT
    ===================================================== */

    const studentId =
      req.params.id;

    const student =
      await Student.findById(
        studentId
      );

    if (!student) {
      return res.status(404).json({
        message:
          "Student not found",
      });
    }

    /* =====================================================
       ORIGINAL STUDENT ID
    ===================================================== */

    const originalStudentId =
      student.studentId;

    /* =====================================================
       PROFILE PHOTO
    ===================================================== */

    let profilePhoto =
      student.profilePhoto;

    if (req.file) {
      profilePhoto =
        req.file.path;

      console.log(
        "📸 NEW PROFILE PHOTO:",
        profilePhoto
      );
    } else if (
      req.body.profilePhoto
    ) {
      profilePhoto =
        req.body.profilePhoto;
    }

    /* =====================================================
       NORMALIZE FIELDS
    ===================================================== */

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
        ? req.body.email
            .trim()
            .toLowerCase()
        : student.email || "";

    /* =====================================================
       CHECK STUDENT ID CHANGE
    ===================================================== */

    if (
      newStudentId !==
      originalStudentId
    ) {
      const duplicateStudent =
        await Student.findOne({
          studentId:
            newStudentId,

          _id: {
            $ne: student._id,
          },
        });

      if (duplicateStudent) {
        return res.status(400).json({
          message:
            "Another student already uses this Student ID.",
        });
      }
    }

    /* =====================================================
       CHECK EMAIL DUPLICATE
    ===================================================== */

    if (email) {
      const existingStudentUser =
        await User.findOne({
          studentId:
            originalStudentId,

          role:
            "student",
        });

      const duplicateEmailUser =
        await User.findOne({
          email,

          _id: {
            $ne:
              existingStudentUser?._id,
          },
        });

      if (duplicateEmailUser) {
        return res.status(400).json({
          message:
            "This email address is already being used by another account.",
        });
      }
    }

    /* =====================================================
       UPDATE STUDENT
    ===================================================== */

    const updatedData = {
      ...req.body,

      studentId:
        newStudentId,

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

    /* =====================================================
       FIND CORRESPONDING USER
    ===================================================== */

    let studentUser =
      await User.findOne({
        studentId:
          originalStudentId,

        role:
          "student",
      });

    /* =====================================================
       CREATE USER IF MISSING
    ===================================================== */

    if (!studentUser) {
      const result =
        await createOrUpdateStudentUser({
          studentId:
            newStudentId,

          firstName,

          middleName,

          lastName,

          email,

          profilePhoto,
        });

      studentUser =
        result.user;
    } else {
      /* ===================================================
         SYNCHRONIZE USER
      =================================================== */

      studentUser.firstName =
        firstName;

      studentUser.middleName =
        middleName;

      studentUser.lastName =
        lastName;

      studentUser.name =
        `${firstName} ${
          middleName
            ? middleName + " "
            : ""
        }${lastName}`.trim();

      studentUser.email =
        email;

      studentUser.studentId =
        newStudentId;

      if (profilePhoto) {
        studentUser.profilePhoto =
          profilePhoto;
      }

      studentUser.isVerified =
        true;

      await studentUser.save();

      console.log(
        "✅ USER ACCOUNT SYNCHRONIZED:",
        studentUser.studentId
      );
    }

    /* =====================================================
       HISTORY LOG
    ===================================================== */

    await createHistoryLog({
      userId:
        currentUser._id,

      role:
        mapRoleForHistory(
          currentUser.role
        ),

      action:
        "Update Student Details",

      category:
        "Student",

      details:
        `Student details updated: (Student ID: ${newStudentId})`,

      ipAddress:
        req.ip,
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(200).json({
      success: true,

      message:
        "Student and User account updated successfully.",

      student:
        updatedStudent,

      profilePhoto,
    });
  } catch (error) {
    console.error(
      "FAILED TO UPDATE STUDENT:",
      error
    );

    return res.status(400).json({
      success: false,

      message:
        "Failed to update student",

      error:
        error.message,
    });
  }
};


/* =========================================================
   UPDATE MY PROFILE
========================================================= */

export const updateMyProfile = async (
  req,
  res
) => {
  try {
    const userId =
      req.user._id;

    const {
      firstName,
      middleName,
      lastName,
      phone,
    } = req.body;

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    if (
      user.role !==
      "student"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only students can update their profile.",
      });
    }

    const student =
      await Student.findOne({
        studentId:
          user.studentId,
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
        message:
          "First name is required.",
      });
    }

    if (!lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Last name is required.",
      });
    }

    student.firstName =
      firstName.trim();

    student.middleName =
      middleName?.trim() || "";

    student.lastName =
      lastName.trim();

    student.phone =
      phone?.trim() || "";

    await student.save();

    /* =====================================================
       SYNCHRONIZE USER
    ===================================================== */

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
        _id:
          student._id,

        firstName:
          student.firstName,

        middleName:
          student.middleName,

        lastName:
          student.lastName,

        studentId:
          student.studentId,

        grade:
          student.grade,

        email:
          student.email,

        phone:
          student.phone,

        profilePhoto:
          student.profilePhoto,

        riskLevel:
          student.riskLevel,
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

      error:
        error.message,
    });
  }
};


/* =========================================================
   UPDATE MY PROFILE PHOTO
========================================================= */

export const updateMyProfilePhoto =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.user._id;

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      if (
        user.role !==
        "student"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only students can update their profile photo.",
        });
      }

      const student =
        await Student.findOne({
          studentId:
            user.studentId,
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

      /* ===================================================
         KEEP USER PROFILE PHOTO SYNCHRONIZED
      =================================================== */

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

        error:
          error.message,
      });
    }
  };


/* =========================================================
   BULK CREATE / UPDATE STUDENTS
========================================================= */

export const createStudentsBulk =
  async (
    req,
    res
  ) => {
    console.log(
      "🔥 BULK ROUTE HIT"
    );

    console.log(
      "REQ BODY:",
      req.body
    );

    try {
      const currentUser =
        await User.findById(
          req.userId
        );

      if (!currentUser) {
        return res.status(404).json({
          message:
            "Current user not found.",
        });
      }

      const students =
        req.body;

      if (
        !Array.isArray(
          students
        ) ||
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

      let emailsSent = 0;
      let emailsFailed = 0;

      const errors = [];

      const gradeMap = {
        "Grade 10":
          "Grade 11",

        "Grade 11":
          "Grade 12",

        "Grade 12":
          "Grade 12",

        Grade12:
          "Graduated",
      };

      /* ===================================================
         PROCESS EACH STUDENT
      =================================================== */

      for (
        const s of students
      ) {
        try {
          /* ================================================
             VALIDATE STUDENT ID
          ================================================ */

          if (!s.studentId) {
            invalid++;

            errors.push({
              studentId:
                null,

              reason:
                "Missing studentId",
            });

            continue;
          }

          const normalizedStudentId =
            String(
              s.studentId
            ).trim();

          /* ================================================
             FIND EXISTING STUDENT
          ================================================ */

          const existing =
            await Student.findOne({
              studentId:
                normalizedStudentId,
            });

          /* ================================================
             UPDATE EXISTING STUDENT
          ================================================ */

          if (existing) {
            const newGrade =
              gradeMap[
                s.grade ||
                  existing.grade
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
                        String(
                          s.firstName
                        ).trim(),
                    }),

                    ...(s.lastName && {
                      lastName:
                        String(
                          s.lastName
                        ).trim(),
                    }),

                    ...(s.middleName !==
                      undefined && {
                      middleName:
                        String(
                          s.middleName
                        ).trim(),
                    }),

                    ...(s.email && {
                      email:
                        String(
                          s.email
                        )
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

                    grade:
                      newGrade,
                  },
                },

                {
                  new: true,

                  runValidators:
                    true,
                }
              );

            /* ==============================================
               SYNCHRONIZE EXISTING USER

               IMPORTANT:
               No welcome email is sent here.
            ============================================== */

            if (updatedStudent) {
              const studentEmail =
                updatedStudent.email
                  ?.trim()
                  .toLowerCase() ||
                "";

              try {
                await createOrUpdateStudentUser({
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
                });
              } catch (
                userError
              ) {
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

          /* ================================================
             INSERT VALIDATION
          ================================================ */

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

          /* ================================================
             NORMALIZE EMAIL
          ================================================ */

          const studentEmail =
            s.email
              ? String(
                  s.email
                )
                  .trim()
                  .toLowerCase()
              : "";

          /* ================================================
             CREATE STUDENT
          ================================================ */

          const newStudent =
            await Student.create({
              studentId:
                normalizedStudentId,

              firstName:
                String(
                  s.firstName
                ).trim(),

              lastName:
                String(
                  s.lastName
                ).trim(),

              middleName:
                s.middleName
                  ? String(
                      s.middleName
                    ).trim()
                  : "",

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

          /* ================================================
             CREATE USER
          ================================================ */

          let userResult;

          try {
            userResult =
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
          } catch (
            userError
          ) {
            /*
             * If User creation fails, roll back Student.
             */

            await Student.findByIdAndDelete(
              newStudent._id
            );

            throw userError;
          }

          /* ================================================
             SEND WELCOME EMAIL
          ================================================

             Only NEW accounts get an email.

             Existing accounts never reach this block.
          ================================================ */

          if (
            userResult.created &&
            studentEmail
          ) {
            try {
              await sendStudentWelcomeEmail({
                email:
                  studentEmail,

                firstName:
                  newStudent.firstName,

                studentId:
                  normalizedStudentId,

                password:
                  userResult.initialPassword,
              });

              emailsSent++;

              console.log(
                `📧 Welcome email sent to ${studentEmail}`
              );
            } catch (
              emailError
            ) {
              emailsFailed++;

              /*
               * IMPORTANT:
               * Email failure does NOT invalidate
               * the student import.
               */

              console.error(
                `⚠️ Welcome email failed for ${normalizedStudentId} (${studentEmail}):`,
                emailError
              );

              errors.push({
                studentId:
                  normalizedStudentId,

                reason:
                  "Student account created, but welcome email failed.",
              });
            }
          }

          /* ================================================
             INSERT COUNT
          ================================================ */

          inserted++;
        } catch (
          studentError
        ) {
          console.error(
            "❌ BULK STUDENT ERROR:",
            studentError
          );

          invalid++;

          errors.push({
            studentId:
              s.studentId ||
              null,

            reason:
              studentError.message ||
              "Failed to process student",
          });
        }
      }

      /* ===================================================
         FINAL RESULT
      =================================================== */

      console.log(
        "📊 FINAL RESULT:",
        {
          inserted,
          updated,
          invalid,
          emailsSent,
          emailsFailed,
        }
      );

      /* ===================================================
         HISTORY LOG
      =================================================== */

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
          `Inserted: ${inserted}, Updated: ${updated}, Invalid: ${invalid}, Emails Sent: ${emailsSent}, Emails Failed: ${emailsFailed}`,

        ipAddress:
          req.ip,
      });

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(200).json({
        success: true,

        message:
          "Bulk upsert completed",

        inserted,

        updated,

        invalid,

        emailsSent,

        emailsFailed,

        errors,
      });
    } catch (
      error
    ) {
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

export const previewBulkStudents =
  async (
    req,
    res
  ) => {
    try {
      const students =
        req.body;

      if (
        !Array.isArray(
          students
        )
      ) {
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

      for (
        const s of students
      ) {
        if (!s.studentId) {
          result.invalid.push({
            data:
              s,

            reason:
              "Missing studentId",
          });

          continue;
        }

        const normalizedStudentId =
          String(
            s.studentId
          ).trim();

        const existing =
          await Student.findOne({
            studentId:
              normalizedStudentId,
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

            firstName:
              s.firstName || "",

            middleName:
              s.middleName || "",

            lastName:
              s.lastName || "",

            gender:
              s.gender ||
              "Male",
          });
        }
      }

      return res.json(
        result
      );
    } catch (
      err
    ) {
      console.error(
        "PREVIEW BULK ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Preview failed",
      });
    }
  };


/* =========================================================
   GET STUDENT TIMELINE
========================================================= */

export const getStudentTimeline =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const [
        reports,
        incidents,
        cases,
        interventions,
      ] =
        await Promise.all([
          Report.find({
            studentId:
              id,
          }),

          Incident.find({
            studentId:
              id,
          }),

          Case.find({
            studentId:
              id,
          }),

          Intervention.find({
            studentId:
              id,
          }),
        ]);

      const timeline = [
        ...reports.map(
          (r) => ({
            type:
              "REPORT",

            date:
              r.createdAt,

            data:
              r,
          })
        ),

        ...incidents.map(
          (i) => ({
            type:
              "INCIDENT",

            date:
              i.createdAt,

            data:
              i,
          })
        ),

        ...cases.map(
          (c) => ({
            type:
              "CASE",

            date:
              c.createdAt,

            data:
              c,
          })
        ),

        ...interventions.map(
          (i) => ({
            type:
              "INTERVENTION",

            date:
              i.createdAt,

            data:
              i,
          })
        ),
      ];

      timeline.sort(
        (a, b) =>
          new Date(
            b.date
          ) -
          new Date(
            a.date
          )
      );

      return res.json(
        timeline
      );
    } catch (
      err
    ) {
      console.error(
        "GET STUDENT TIMELINE ERROR:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };


/* =========================================================
   DELETE STUDENT
========================================================= */

export const deleteStudent =
  async (
    req,
    res
  ) => {
    try {
      const currentUser =
        await User.findById(
          req.userId
        );

      if (!currentUser) {
        return res.status(404).json({
          message:
            "Current user not found.",
        });
      }

      /* ===================================================
         FIND STUDENT
      =================================================== */

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

      /* ===================================================
         DELETE CORRESPONDING USER
      =================================================== */

      const deletedUser =
        await User.findOneAndDelete({
          studentId:
            student.studentId,

          role:
            "student",
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

      /* ===================================================
         DELETE STUDENT
      =================================================== */

      await Student.findByIdAndDelete(
        req.params.id
      );

      /* ===================================================
         HISTORY LOG
      =================================================== */

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
    } catch (
      error
    ) {
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

export const searchStudents =
  async (
    req,
    res
  ) => {
    try {
      const { query } =
        req.query;

      if (!query) {
        return res.json(
          []
        );
      }

      let excludeStudentId =
        null;

      /* ===================================================
         FIND CURRENT STUDENT
      =================================================== */

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

          if (
            currentStudent
          ) {
            excludeStudentId =
              currentStudent._id;
          }
        }
      }

      /* ===================================================
         SEARCH FILTER
      =================================================== */

      const searchFilter = {
        $or: [
          {
            firstName: {
              $regex:
                query,

              $options:
                "i",
            },
          },

          {
            lastName: {
              $regex:
                query,

              $options:
                "i",
            },
          },

          {
            email: {
              $regex:
                query,

              $options:
                "i",
            },
          },
        ],
      };

      if (
        excludeStudentId
      ) {
        searchFilter._id = {
          $ne:
            excludeStudentId,
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

      return res.json(
        students
      );
    } catch (
      error
    ) {
      console.error(
        "SEARCH STUDENTS ERROR:",
        error
      );

      return res.status(500).json({
        message:
          error.message,
      });
    }
  };