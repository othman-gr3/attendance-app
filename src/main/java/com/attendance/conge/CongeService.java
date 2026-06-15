package com.attendance.conge;

import com.attendance.conge.dto.CongeRequest;
import com.attendance.user.User;
import com.attendance.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CongeService {
    @Autowired
    private CongeRepository congeRepository;

    @Autowired
    private UserRepository userRepository;

    public Conge createConge(CongeRequest request, String userEmail) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = userOpt.get();
        Conge conge = new Conge();
        conge.setUserId(user.getId());
        conge.setDateDebut(request.getDateDebut());
        conge.setDateFin(request.getDateFin());
        conge.setType(request.getType());
        conge.setStatut("en_attente");

        return congeRepository.save(conge);
    }

    public Conge updateCongeStatut(String congeId, String newStatut) {
        Optional<Conge> congeOpt = congeRepository.findById(congeId);
        if (congeOpt.isEmpty()) {
            throw new IllegalArgumentException("Conge not found");
        }

        Conge conge = congeOpt.get();
        conge.setStatut(newStatut);
        return congeRepository.save(conge);
    }

    public List<Conge> getCongesForUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = userOpt.get();
        return congeRepository.findByUserId(user.getId());
    }

    public List<Conge> getAllConges() {
        return congeRepository.findAll();
    }
}
