package com.attendance.pointage;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PointageRepository extends MongoRepository<Pointage, String> {
    List<Pointage> findByUserIdAndDate(String userId, String date);
    List<Pointage> findByUserId(String userId);
}