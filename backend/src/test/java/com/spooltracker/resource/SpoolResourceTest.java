package com.spooltracker.resource;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class SpoolResourceTest {

    @Test
    public void testGetAllSpools() {
        given()
          .when().get("/api/spools")
          .then()
             .statusCode(200);
    }

    @Test
    public void testGetAllSpoolsWithPagination() {
        given()
          .queryParam("page", 0)
          .queryParam("pageSize", 10)
          .when().get("/api/spools")
          .then()
             .statusCode(200);
    }

    @Test
    public void testGetSpoolByIdNotFound() {
        given()
          .when().get("/api/spools/999999")
          .then()
             .statusCode(404);
    }
}

