package com.attendance.attendanceapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = "com.attendance")
@EnableMongoRepositories(basePackages = "com.attendance")
public class AttendanceAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(AttendanceAppApplication.class, args);
    }
}