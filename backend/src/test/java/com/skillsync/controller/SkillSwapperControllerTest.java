package com.skillsync.controller;

import com.skillsync.dto.SkillMatchDTO;
import com.skillsync.service.SkillSwapperService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SkillSwapperControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SkillSwapperService skillSwapperService;

    @Test
    void testGetMatchesWithoutToken_Returns401Unauthorized() throws Exception {
        mockMvc.perform(get("/api/skill-swapper/matches")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "student@example.com")
    void testGetMatchesWithAuthenticatedUser_ReturnsMatches() throws Exception {
        SkillMatchDTO match1 = new SkillMatchDTO(
                2L,
                "Student B",
                "Bio B",
                "City",
                "Degree",
                null,
                Arrays.asList("Java", "Python"),
                Collections.singletonList("Python"),
                1,
                50.0,
                "NONE"
        );

        when(skillSwapperService.findMatches(1)).thenReturn(Collections.singletonList(match1));

        mockMvc.perform(get("/api/skill-swapper/matches")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(2))
                .andExpect(jsonPath("$[0].name").value("Student B"))
                .andExpect(jsonPath("$[0].matchCount").value(1))
                .andExpect(jsonPath("$[0].matchPercentage").value(50.0))
                .andExpect(jsonPath("$[0].connectionStatus").value("NONE"));
    }

    @Test
    @WithMockUser(username = "student@example.com")
    void testGetMatchesWithMinMatchesParam() throws Exception {
        when(skillSwapperService.findMatches(2)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/skill-swapper/matches")
                        .param("minMatches", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
