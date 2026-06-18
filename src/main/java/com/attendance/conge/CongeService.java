package com.attendance.conge;

import com.attendance.conge.dto.CongeRequest;
import com.attendance.user.User;
import com.attendance.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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
        
        LocalDate debut = LocalDate.parse(request.getDateDebut());
        LocalDate fin = LocalDate.parse(request.getDateFin());
        if (debut.isAfter(fin)) {
            throw new IllegalArgumentException("Start date must be before end date.");
        }

        long daysRequested = ChronoUnit.DAYS.between(debut, fin) + 1;

        // 1. Solde Congés Check (Annual Leave)
        if ("annuel".equals(request.getType())) {
            int currentYear = LocalDate.now().getYear();
            int congesUsedThisYear = 0;
            List<Conge> conges = congeRepository.findByUserId(user.getId());
            for (Conge c : conges) {
                if ("valide".equals(c.getStatut()) && "annuel".equals(c.getType())) {
                    LocalDate cDebut = LocalDate.parse(c.getDateDebut());
                    LocalDate cFin = LocalDate.parse(c.getDateFin());
                    if (cDebut.getYear() == currentYear || cFin.getYear() == currentYear) {
                        congesUsedThisYear += ChronoUnit.DAYS.between(cDebut, cFin) + 1;
                    }
                }
            }
            int congesRestants = 20 - congesUsedThisYear;
            if (daysRequested > congesRestants) {
                throw new IllegalArgumentException("Insufficient annual leave balance (" + congesRestants + " days remaining, requested: " + daysRequested + " days).");
            }
        }

        // 2. Anticipation check (5 days in advance for annual and exceptional)
        if (!"maladie".equals(request.getType())) {
            LocalDate minAllowedDate = LocalDate.now().plusDays(5);
            if (debut.isBefore(minAllowedDate)) {
                throw new IllegalArgumentException("Annual/exceptional leave requests must be submitted at least 5 days in advance.");
            }
        }

        // 3. Overlap check with active conges (valide or en_attente)
        List<Conge> existing = congeRepository.findByUserId(user.getId());
        for (Conge c : existing) {
            if (!"refuse".equals(c.getStatut())) {
                LocalDate eDebut = LocalDate.parse(c.getDateDebut());
                LocalDate eFin = LocalDate.parse(c.getDateFin());
                if (!debut.isAfter(eFin) && !fin.isBefore(eDebut)) {
                    throw new IllegalArgumentException("You already have a leave request (" + ("en_attente".equals(c.getStatut()) ? "pending" : "approved") + ") overlapping this period (" + c.getDateDebut() + " to " + c.getDateFin() + ").");
                }
            }
        }

        // 4. Sick leave 2 days limit without certificate
        if ("maladie".equals(request.getType())) {
            if (daysRequested > 2) {
                throw new IllegalArgumentException("Sick leaves exceeding 2 days require a physical medical certificate. Please contact HR directly.");
            }
        }

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
