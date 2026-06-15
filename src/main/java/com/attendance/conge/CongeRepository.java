package com.attendance.conge;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CongeRepository extends MongoRepository<Conge, String> {
    List<Conge> findByUserId(String userId);
}
