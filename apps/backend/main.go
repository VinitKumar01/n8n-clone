package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/vinitkumar01/n8n-clone/internal/database"
	"github.com/vinitkumar01/n8n-clone/routes"

	_ "github.com/lib/pq"
)

func main() {
	godotenv.Load("./.env")

	port := os.Getenv("PORT")

	if port == "" {
		log.Fatal("PORT not found in env")
	}

	dbUrl := os.Getenv("DB_URL")

	if dbUrl == "" {
		log.Fatal("DB_URL not found in env")
	}

	conn, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}

	queries := database.New(conn)
	db := routes.Db{
		Queries: queries,
	}

	router := chi.NewRouter()
	router.Use(cors.Handler(cors.Options{
		// AllowedOrigins: []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins:   []string{"https://*", "http://*"}, // Allows requests from any origin (development setting)
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value for Access-Control-Max-Age header
	}))

	v1Router := chi.NewRouter()
	v1Router.Get("/health", routes.HandlerReadiness)
	v1Router.Post("/users", db.HandlerCreateUser)
	v1Router.Get("/users/{userId}", db.HandlerGetUserById)
	v1Router.Post("/workflow", db.HandlerCreateWorkflow)
	v1Router.Get("/workflow/{workflowId}", db.HandlerGetWorkflowById)
	v1Router.Get("/nodes/gemini", routes.HandlerGemini)

	router.Mount("/v1", v1Router)

	srv := &http.Server{
		Handler: router,
		Addr:    ":" + port,
	}

	fmt.Printf("Server starting at port %s\n", port)

	err = srv.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
