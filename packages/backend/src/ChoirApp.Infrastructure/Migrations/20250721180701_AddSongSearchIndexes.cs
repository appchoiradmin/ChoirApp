using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSongSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add database indexes for optimal song search performance
            
            // Index on song title for fast title searches
            migrationBuilder.CreateIndex(
                name: "IX_Songs_Title",
                table: "Songs",
                column: "title");
            
            // Index on song artist for fast artist searches
            migrationBuilder.CreateIndex(
                name: "IX_Songs_Artist",
                table: "Songs",
                column: "artist");
            
            // Index on song visibility for fast visibility filtering
            migrationBuilder.CreateIndex(
                name: "IX_Songs_Visibility",
                table: "Songs",
                column: "visibility");
            
            // Index on creator_id for fast user song queries
            migrationBuilder.CreateIndex(
                name: "IX_Songs_CreatorId",
                table: "Songs",
                column: "creator_id");
            
            // Index on choir_id in SongVisibilities for fast choir visibility filtering
            migrationBuilder.CreateIndex(
                name: "IX_SongVisibilities_ChoirId",
                table: "SongVisibilities",
                column: "choir_id");
            
            // Composite index on song_id and choir_id for optimal visibility joins
            migrationBuilder.CreateIndex(
                name: "IX_SongVisibilities_SongId_ChoirId",
                table: "SongVisibilities",
                columns: new[] { "song_id", "choir_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop all the indexes we created
            
            migrationBuilder.DropIndex(
                name: "IX_Songs_Title",
                table: "Songs");
            
            migrationBuilder.DropIndex(
                name: "IX_Songs_Artist",
                table: "Songs");
            
            migrationBuilder.DropIndex(
                name: "IX_Songs_Visibility",
                table: "Songs");
            
            migrationBuilder.DropIndex(
                name: "IX_Songs_CreatorId",
                table: "Songs");
            
            migrationBuilder.DropIndex(
                name: "IX_SongVisibilities_ChoirId",
                table: "SongVisibilities");
            
            migrationBuilder.DropIndex(
                name: "IX_SongVisibilities_SongId_ChoirId",
                table: "SongVisibilities");
        }
    }
}
