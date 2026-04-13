package main

import (
	"context"
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
	"github.com/vinitkumar01/n8n-clone/utils"

	_ "github.com/lib/pq"
)

func main() {
	if os.Getenv("RENDER") == "" {
		_ = godotenv.Load()
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbUrl := os.Getenv("DB_URL")
	if dbUrl == "" {
		log.Fatal("DB_URL not found in env")
	}

	conn, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}

	if err := conn.Ping(); err != nil {
		log.Fatal("Database not reachable:", err)
	}

	queries := database.New(conn)
	db := routes.Db{
		DB:      conn,
		Queries: queries,
	}

	router := chi.NewRouter()

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // tighten later in prod if needed
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	v1Router := chi.NewRouter()
	v1Router.Get("/health", routes.HandlerReadiness)
	v1Router.Get("/users/{userId}", db.HandlerGetUserById)
	v1Router.Post("/workflow", db.HandlerCreateWorkflow)
	v1Router.Put("/workflow", db.HandlerUpdateWorkflow)
	v1Router.Get("/workflow/{workflowId}", db.HandlerGetWorkflowById)
	v1Router.Post("/workflow/{workflowId}/execute", db.HandlerWorkflowExecute)
	v1Router.Get("/workflows/{userId}", db.HandlerGetWorkflowsByUserId)
	v1Router.Post("/workflow/status", db.HandlerWorkflowStatus)
	v1Router.Post("/clerk/webhook", db.HandlerClerkWebhook)
	v1Router.Post("/webhook/{workflowID}/{nodeID}", db.HandlerWorkflowWebhook)

	router.Mount("/v1", v1Router)

	srv := &http.Server{
		Handler: router,
		Addr:    "0.0.0.0:" + port,
	}

	fmt.Printf("🚀 Server running on port %s\n", port)

	utils.RegisterNodes()

	if err := utils.RegisterWebhooks(context.Background(), db.Queries); err != nil {
		log.Fatal(err)
	}

	if err := utils.RegisterSchedulers(context.Background(), db.Queries); err != nil {
		log.Fatal(err)
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
