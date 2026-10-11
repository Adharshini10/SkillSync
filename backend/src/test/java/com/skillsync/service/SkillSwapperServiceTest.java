package com.skillsync.service;

import com.skillsync.dto.SkillMatchDTO;
import com.skillsync.model.*;
import com.skillsync.repository.ConnectionRepository;
import com.skillsync.repository.ProfileRepository;
import com.skillsync.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillSwapperServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private ProfileRepository profileRepository;

    @InjectMocks
    private SkillSwapperService skillSwapperService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("studentA@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        currentUser = new User("Student A", "studentA@example.com", "password");
        currentUser.setId(1L);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testMatchingScenariosFromSpecification() {
        // Student A wants: Python, React, Machine Learning
        Set<LearningSkill> desiredSkills = new HashSet<>();
        desiredSkills.add(new LearningSkill("Python"));
        desiredSkills.add(new LearningSkill("React"));
        desiredSkills.add(new LearningSkill("Machine Learning"));
        currentUser.setLearningSkills(desiredSkills);

        when(userRepository.findByEmail("studentA@example.com")).thenReturn(Optional.of(currentUser));

        // Candidate Student B: Python, Machine Learning, Java
        User studentB = new User("Student B", "studentB@example.com", "pass");
        studentB.setId(2L);
        studentB.setSkills(new HashSet<>(Arrays.asList(
                new Skill("Python"),
                new Skill("Machine Learning"),
                new Skill("Java")
        )));

        // Candidate Student C: React, HTML, CSS
        User studentC = new User("Student C", "studentC@example.com", "pass");
        studentC.setId(3L);
        studentC.setSkills(new HashSet<>(Arrays.asList(
                new Skill("React"),
                new Skill("HTML"),
                new Skill("CSS")
        )));

        // Candidate Student D: Python, React, Machine Learning, Java
        User studentD = new User("Student D", "studentD@example.com", "pass");
        studentD.setId(4L);
        studentD.setSkills(new HashSet<>(Arrays.asList(
                new Skill("Python"),
                new Skill("React"),
                new Skill("Machine Learning"),
                new Skill("Java")
        )));

        // Candidate Student E: Java, C++ (0 matches)
        User studentE = new User("Student E", "studentE@example.com", "pass");
        studentE.setId(5L);
        studentE.setSkills(new HashSet<>(Arrays.asList(
                new Skill("Java"),
                new Skill("C++")
        )));

        when(userRepository.findAll()).thenReturn(Arrays.asList(currentUser, studentB, studentC, studentD, studentE));
        when(profileRepository.findAll()).thenReturn(Collections.emptyList());
        when(connectionRepository.findAllConnectionsForUser(currentUser)).thenReturn(Collections.emptyList());

        List<SkillMatchDTO> matches = skillSwapperService.findMatches(1);

        // Verification:
        // Student E has 0 matches -> excluded.
        // Current user (Student A) -> excluded.
        // Expected returned list size = 3
        assertEquals(3, matches.size());

        // 1st place: Student D (3 matches, 100.0%)
        SkillMatchDTO first = matches.get(0);
        assertEquals(4L, first.getUserId());
        assertEquals("Student D", first.getName());
        assertEquals(3, first.getMatchCount());
        assertEquals(100.0, first.getMatchPercentage());
        assertEquals(Arrays.asList("Machine Learning", "Python", "React"), first.getMatchedSkills());
        assertEquals("NONE", first.getConnectionStatus());

        // 2nd place: Student B (2 matches, 66.67%)
        SkillMatchDTO second = matches.get(1);
        assertEquals(2L, second.getUserId());
        assertEquals("Student B", second.getName());
        assertEquals(2, second.getMatchCount());
        assertEquals(66.67, second.getMatchPercentage());
        assertEquals(Arrays.asList("Machine Learning", "Python"), second.getMatchedSkills());

        // 3rd place: Student C (1 match, 33.33%)
        SkillMatchDTO third = matches.get(2);
        assertEquals(3L, third.getUserId());
        assertEquals("Student C", third.getName());
        assertEquals(1, third.getMatchCount());
        assertEquals(33.33, third.getMatchPercentage());
        assertEquals(Collections.singletonList("React"), third.getMatchedSkills());
    }

    @Test
    void testCurrentUserHasNoLearningSkills_ReturnsEmptyList() {
        currentUser.setLearningSkills(Collections.emptySet());
        when(userRepository.findByEmail("studentA@example.com")).thenReturn(Optional.of(currentUser));

        List<SkillMatchDTO> matches = skillSwapperService.findMatches(1);

        assertTrue(matches.isEmpty());
        verify(userRepository, never()).findAll();
    }

    @Test
    void testCaseInsensitiveAndWhitespaceTrimmedMatching() {
        // Current user wants "  python  "
        currentUser.setLearningSkills(new HashSet<>(Collections.singletonList(
                new LearningSkill("  python  ")
        )));
        when(userRepository.findByEmail("studentA@example.com")).thenReturn(Optional.of(currentUser));

        // Candidate has "PYTHON"
        User candidate = new User("Rahul", "rahul@example.com", "pass");
        candidate.setId(10L);
        candidate.setSkills(new HashSet<>(Collections.singletonList(
                new Skill("  PYTHON  ")
        )));

        when(userRepository.findAll()).thenReturn(Arrays.asList(currentUser, candidate));
        when(profileRepository.findAll()).thenReturn(Collections.emptyList());
        when(connectionRepository.findAllConnectionsForUser(currentUser)).thenReturn(Collections.emptyList());

        List<SkillMatchDTO> matches = skillSwapperService.findMatches(1);

        assertEquals(1, matches.size());
        assertEquals(1, matches.get(0).getMatchCount());
        assertEquals(100.0, matches.get(0).getMatchPercentage());
        assertEquals(Collections.singletonList("PYTHON"), matches.get(0).getMatchedSkills());
    }

    @Test
    void testDuplicateSkillsOnCandidate_CountedOnce() {
        currentUser.setLearningSkills(new HashSet<>(Arrays.asList(
                new LearningSkill("Python"),
                new LearningSkill("React")
        )));
        when(userRepository.findByEmail("studentA@example.com")).thenReturn(Optional.of(currentUser));

        User candidate = new User("Bob", "bob@example.com", "pass");
        candidate.setId(20L);
        // Candidate has duplicate "Python" and "python"
        candidate.setSkills(new HashSet<>(Arrays.asList(
                new Skill("Python"),
                new Skill("python")
        )));

        when(userRepository.findAll()).thenReturn(Collections.singletonList(candidate));
        when(profileRepository.findAll()).thenReturn(Collections.emptyList());
        when(connectionRepository.findAllConnectionsForUser(currentUser)).thenReturn(Collections.emptyList());

        List<SkillMatchDTO> matches = skillSwapperService.findMatches(1);

        assertEquals(1, matches.size());
        assertEquals(1, matches.get(0).getMatchCount());
        assertEquals(50.0, matches.get(0).getMatchPercentage());
    }

    @Test
    void testMinMatchesFilter() {
        currentUser.setLearningSkills(new HashSet<>(Arrays.asList(
                new LearningSkill("Python"),
                new LearningSkill("React"),
                new LearningSkill("Docker")
        )));
        when(userRepository.findByEmail("studentA@example.com")).thenReturn(Optional.of(currentUser));

        User student1 = new User("Student 1", "s1@example.com", "pass");
        student1.setId(11L);
        student1.setSkills(new HashSet<>(Collections.singletonList(new Skill("Python")))); // 1 match

        User student2 = new User("Student 2", "s2@example.com", "pass");
        student2.setId(12L);
        student2.setSkills(new HashSet<>(Arrays.asList(new Skill("Python"), new Skill("React")))); // 2 matches

        when(userRepository.findAll()).thenReturn(Arrays.asList(student1, student2));
        when(profileRepository.findAll()).thenReturn(Collections.emptyList());
        when(connectionRepository.findAllConnectionsForUser(currentUser)).thenReturn(Collections.emptyList());

        // minMatches = 2 should exclude student1
        List<SkillMatchDTO> matches = skillSwapperService.findMatches(2);

        assertEquals(1, matches.size());
        assertEquals(12L, matches.get(0).getUserId());
        assertEquals(2, matches.get(0).getMatchCount());
    }

    @Test
    void testConnectionStatuses() {
        currentUser.setLearningSkills(new HashSet<>(Collections.singletonList(new LearningSkill("Java"))));
        when(userRepository.findByEmail("studentA@example.com")).thenReturn(Optional.of(currentUser));

        // User 2: PENDING_SENT (current user sent request)
        User u2 = new User("User 2", "u2@example.com", "pass");
        u2.setId(2L);
        u2.setSkills(new HashSet<>(Collections.singletonList(new Skill("Java"))));

        // User 3: PENDING_RECEIVED (u3 sent request to current user)
        User u3 = new User("User 3", "u3@example.com", "pass");
        u3.setId(3L);
        u3.setSkills(new HashSet<>(Collections.singletonList(new Skill("Java"))));

        // User 4: ACCEPTED
        User u4 = new User("User 4", "u4@example.com", "pass");
        u4.setId(4L);
        u4.setSkills(new HashSet<>(Collections.singletonList(new Skill("Java"))));

        // User 5: REJECTED
        User u5 = new User("User 5", "u5@example.com", "pass");
        u5.setId(5L);
        u5.setSkills(new HashSet<>(Collections.singletonList(new Skill("Java"))));

        when(userRepository.findAll()).thenReturn(Arrays.asList(u2, u3, u4, u5));
        when(profileRepository.findAll()).thenReturn(Collections.emptyList());

        Connection connSent = new Connection(currentUser, u2, ConnectionStatus.PENDING);
        Connection connReceived = new Connection(u3, currentUser, ConnectionStatus.PENDING);
        Connection connAccepted = new Connection(currentUser, u4, ConnectionStatus.ACCEPTED);
        Connection connRejected = new Connection(u5, currentUser, ConnectionStatus.REJECTED);

        when(connectionRepository.findAllConnectionsForUser(currentUser))
                .thenReturn(Arrays.asList(connSent, connReceived, connAccepted, connRejected));

        List<SkillMatchDTO> matches = skillSwapperService.findMatches(1);

        Map<Long, String> statusMap = new HashMap<>();
        for (SkillMatchDTO m : matches) {
            statusMap.put(m.getUserId(), m.getConnectionStatus());
        }

        assertEquals("PENDING_SENT", statusMap.get(2L));
        assertEquals("PENDING_RECEIVED", statusMap.get(3L));
        assertEquals("ACCEPTED", statusMap.get(4L));
        assertEquals("REJECTED", statusMap.get(5L));
    }
}
