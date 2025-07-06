using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaylistTemplateIdToPlaylist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "playlist_template_id",
                table: "Playlists",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Playlists_playlist_template_id",
                table: "Playlists",
                column: "playlist_template_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Playlists_PlaylistTemplates_playlist_template_id",
                table: "Playlists",
                column: "playlist_template_id",
                principalTable: "PlaylistTemplates",
                principalColumn: "template_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Playlists_PlaylistTemplates_playlist_template_id",
                table: "Playlists");

            migrationBuilder.DropIndex(
                name: "IX_Playlists_playlist_template_id",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "playlist_template_id",
                table: "Playlists");
        }
    }
}
