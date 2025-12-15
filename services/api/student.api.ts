import { ClassStudent, ClassDetails, CoursePlan, TestResultData, StudentProgress } from '../../types';
import { checkRateLimit } from './rate-limiter';
import { buildApiUrl } from './config';
import { fetchWithTimeout, getDefaultHeaders, handleResponse } from './client';

/**
 * Student/Grades API
 */
export const studentApi = {
    /**
     * Get all classes for a student
     */
    getAllClasses: async (token: string, studentId: number): Promise<ClassStudent[]> => {
        checkRateLimit();

        try {
            const params = new URLSearchParams({
                limit: '1000',
                paged: '1',
                select: 'namhoc,hocky,class_id',
                'condition[0][key]': 'student_id',
                'condition[0][value]': studentId.toString(),
                'condition[0][compare]': '='
            });

            const response = await fetchWithTimeout(buildApiUrl('/class-students/', params), {
                headers: getDefaultHeaders(token)
            });

            const data = await handleResponse<any>(response, 'getAllClasses');

            return data.data || [];
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get class details by ID
     */
    getClassDetails: async (token: string, classId: number): Promise<ClassDetails | null> => {
        checkRateLimit();

        try {
            const params = new URLSearchParams({
                'with': 'managers'
            });

            const response = await fetchWithTimeout(buildApiUrl(`/class/${classId}`, params), {
                headers: getDefaultHeaders(token)
            });

            const data = await handleResponse<any>(response, 'getClassDetails');

            let classDetail = null;
            if (data.data) {
                if (Array.isArray(data.data)) {
                    classDetail = data.data.length > 0 ? data.data[0] : null;
                } else {
                    classDetail = data.data;
                }
            } else if (data.id) {
                classDetail = data;
            }

            return classDetail;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get course plan for a class
     */
    getCoursePlan: async (token: string, classId: number): Promise<CoursePlan[]> => {
        checkRateLimit();

        try {
            const params = new URLSearchParams({
                limit: '1000',
                paged: '1',
                order: 'ASC',
                orderby: 'week',
                'condition[0][key]': 'class_id',
                'condition[0][value]': classId.toString(),
                'condition[0][compare]': '='
            });

            const response = await fetchWithTimeout(buildApiUrl('/class-plans/', params), {
                headers: getDefaultHeaders(token)
            });

            const data = await handleResponse<any>(response, 'getCoursePlan');
            return data.data || [];
        } catch (error) {
            return [];
        }
    },

    /**
     * Get all test results for a class
     */
    getAllTestResultsForClass: async (token: string, classId: number, studentId?: number): Promise<TestResultData[]> => {
        checkRateLimit();

        // Get student_id from localStorage if not provided
        const effectiveStudentId = studentId || parseInt(localStorage.getItem('ictu_student_id') || '0');

        try {
            const params = new URLSearchParams({
                limit: '1000',
                paged: '1',
                order: 'ASC',
                orderby: 'id',
                'condition[0][key]': 'class_id',
                'condition[0][value]': classId.toString(),
                'condition[0][compare]': '=',
                'condition[1][key]': 'student_id',
                'condition[1][value]': effectiveStudentId.toString(),
                'condition[1][compare]': '='
            });

            const response = await fetchWithTimeout(buildApiUrl('/class-plan-activity-student-tests/', params), {
                headers: getDefaultHeaders(token)
            });


            const data = await handleResponse<any>(response, 'getAllTestResultsForClass');

            // Normalize scores - keep all test types including KT_DAUGIO
            const results = (data.data || []).map((item: any) => {
                let score = 0;
                if (item.tong_diem !== undefined && item.tong_diem !== null) {
                    score = parseFloat(String(item.tong_diem)) / 10;
                } else if (item.av !== undefined && item.av !== null) {
                    score = parseFloat(String(item.av));
                }

                return {
                    id: item.id,
                    class_id: item.class_id,
                    week: item.week,
                    av: score,
                    tong_diem: item.tong_diem ?? 0,
                    time: item.time ?? 0,
                    passed: item.passed ?? 0,
                    submit_at: item.submit_at || new Date().toISOString(),
                    type: item.type, // Keep type to display badge
                    questions: item.questions,
                    test: item.test
                };
            });

            return results;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get test details by ID
     */
    getTestDetails: async (token: string, testId: number): Promise<TestResultData> => {
        checkRateLimit();

        try {
            const params = new URLSearchParams({
                select: 'id,class_plan_activity_id,av,tong_diem,class_id,time,questions,course_id,status,week,passed,submit_at',
                with: 'test',
                'condition[0][key]': 'id',
                'condition[0][value]': testId.toString(),
                'condition[0][compare]': '='
            });

            const response = await fetchWithTimeout(buildApiUrl('/class-plan-activity-student-tests/', params), {
                headers: getDefaultHeaders(token)
            });

            const data = await handleResponse<any>(response, 'getTestDetails');

            if (data.data && data.data.length > 0) {
                const item = data.data[0];

                // Normalize score
                let score = 0;
                if (item.tong_diem !== undefined && item.tong_diem !== null) {
                    score = parseFloat(String(item.tong_diem)) / 10;
                } else if (item.av !== undefined && item.av !== null) {
                    score = parseFloat(String(item.av));
                }

                return {
                    ...item,
                    av: score,
                    type: item.type // Include type field
                };
            }

            throw new Error("Test not found");
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get student progress overview
     */
    getStudentProgress: async (token: string, studentId: number): Promise<StudentProgress[]> => {
        checkRateLimit();

        try {
            const classes = await studentApi.getAllClasses(token, studentId);
            const progress: StudentProgress[] = [];

            for (const cls of classes) {
                try {
                    const details = await studentApi.getClassDetails(token, cls.class_id);
                    if (!details) continue;

                    const results = await studentApi.getAllTestResultsForClass(token, cls.class_id);
                    const bestScore = results.length > 0 ? Math.max(...results.map(r => r.av || 0)) : 0;

                    progress.push({
                        classId: cls.class_id,
                        className: details.name,
                        teacherName: details.managers[0]?.display_name || "N/A",
                        year: cls.namhoc,
                        semester: cls.hocky,
                        latestWeek: results.length > 0 ? Math.max(...results.map(r => r.week)) : 0,
                        totalWeeks: 15,
                        status: bestScore >= 5 ? 'on-track' : (results.length > 0 ? 'behind' : 'on-track'),
                        hasTest: results.length > 0,
                        bestScore: bestScore,
                        testCount: results.length
                    });
                } catch (error) {
                    // Skip this class if error
                }
            }

            return progress;
        } catch (error) {
            return [];
        }
    },
};
