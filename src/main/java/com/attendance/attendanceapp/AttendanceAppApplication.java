package com.attendance.attendanceapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.attendance")
public class AttendanceAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(AttendanceAppApplication.class, args);

    }

}
