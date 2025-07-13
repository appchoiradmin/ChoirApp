using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorSongModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistSongs_MasterSongs_master_song_id",
                table: "PlaylistSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistSongs_SongVersions_song_version_id",
                table: "PlaylistSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistTemplateSongs_MasterSongs_master_song_id",
                table: "PlaylistTemplateSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistTemplateSongs_SongVersions_song_version_id",
                table: "PlaylistTemplateSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_SongTags_MasterSongs_song_id",
                table: "SongTags");

            migrationBuilder.DropForeignKey(
                name: "FK_SongVisibilities_MasterSongs_song_id",
                table: "SongVisibilities");

            migrationBuilder.DropTable(
                name: "VersionTags");

            migrationBuilder.DropTable(
                name: "VersionVisibilities");

            migrationBuilder.DropTable(
                name: "SongVersions");

            migrationBuilder.DropTable(
                name: "MasterSongs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SongVisibilities",
                table: "SongVisibilities");

            migrationBuilder.DropIndex(
                name: "IX_PlaylistTemplateSongs_master_song_id",
                table: "PlaylistTemplateSongs");

            migrationBuilder.DropIndex(
                name: "IX_PlaylistSongs_master_song_id",
                table: "PlaylistSongs");

            migrationBuilder.DropIndex(
                name: "IX_PlaylistSongs_song_version_id",
                table: "PlaylistSongs");

            migrationBuilder.DropColumn(
                name: "master_song_id",
                table: "PlaylistTemplateSongs");

            migrationBuilder.DropColumn(
                name: "master_song_id",
                table: "PlaylistSongs");

            migrationBuilder.DropColumn(
                name: "song_version_id",
                table: "PlaylistSongs");

            migrationBuilder.RenameColumn(
                name: "song_version_id",
                table: "PlaylistTemplateSongs",
                newName: "song_id");

            migrationBuilder.RenameIndex(
                name: "IX_PlaylistTemplateSongs_song_version_id",
                table: "PlaylistTemplateSongs",
                newName: "IX_PlaylistTemplateSongs_song_id");

            migrationBuilder.AddColumn<Guid>(
                name: "song_id",
                table: "PlaylistSongs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_SongVisibilities",
                table: "SongVisibilities",
                column: "visibility_id");

            migrationBuilder.CreateTable(
                name: "Songs",
                columns: table => new
                {
                    song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    artist = table.Column<string>(type: "text", nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    version_number = table.Column<int>(type: "integer", nullable: false),
                    base_song_id = table.Column<Guid>(type: "uuid", nullable: true),
                    visibility = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Songs", x => x.song_id);
                    table.ForeignKey(
                        name: "FK_Songs_Songs_base_song_id",
                        column: x => x.base_song_id,
                        principalTable: "Songs",
                        principalColumn: "song_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Songs_Users_creator_id",
                        column: x => x.creator_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SongVisibilities_song_id_choir_id",
                table: "SongVisibilities",
                columns: new[] { "song_id", "choir_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistSongs_song_id",
                table: "PlaylistSongs",
                column: "song_id");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_base_song_id",
                table: "Songs",
                column: "base_song_id");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_creator_id",
                table: "Songs",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_song_id",
                table: "Songs",
                column: "song_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistSongs_Songs_song_id",
                table: "PlaylistSongs",
                column: "song_id",
                principalTable: "Songs",
                principalColumn: "song_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistTemplateSongs_Songs_song_id",
                table: "PlaylistTemplateSongs",
                column: "song_id",
                principalTable: "Songs",
                principalColumn: "song_id");

            migrationBuilder.AddForeignKey(
                name: "FK_SongTags_Songs_song_id",
                table: "SongTags",
                column: "song_id",
                principalTable: "Songs",
                principalColumn: "song_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SongVisibilities_Songs_song_id",
                table: "SongVisibilities",
                column: "song_id",
                principalTable: "Songs",
                principalColumn: "song_id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistSongs_Songs_song_id",
                table: "PlaylistSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistTemplateSongs_Songs_song_id",
                table: "PlaylistTemplateSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_SongTags_Songs_song_id",
                table: "SongTags");

            migrationBuilder.DropForeignKey(
                name: "FK_SongVisibilities_Songs_song_id",
                table: "SongVisibilities");

            migrationBuilder.DropTable(
                name: "Songs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SongVisibilities",
                table: "SongVisibilities");

            migrationBuilder.DropIndex(
                name: "IX_SongVisibilities_song_id_choir_id",
                table: "SongVisibilities");

            migrationBuilder.DropIndex(
                name: "IX_PlaylistSongs_song_id",
                table: "PlaylistSongs");

            migrationBuilder.DropColumn(
                name: "song_id",
                table: "PlaylistSongs");

            migrationBuilder.RenameColumn(
                name: "song_id",
                table: "PlaylistTemplateSongs",
                newName: "song_version_id");

            migrationBuilder.RenameIndex(
                name: "IX_PlaylistTemplateSongs_song_id",
                table: "PlaylistTemplateSongs",
                newName: "IX_PlaylistTemplateSongs_song_version_id");

            migrationBuilder.AddColumn<Guid>(
                name: "master_song_id",
                table: "PlaylistTemplateSongs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "master_song_id",
                table: "PlaylistSongs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "song_version_id",
                table: "PlaylistSongs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_SongVisibilities",
                table: "SongVisibilities",
                columns: new[] { "song_id", "choir_id" });

            migrationBuilder.CreateTable(
                name: "MasterSongs",
                columns: table => new
                {
                    song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    artist = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    lyrics_chordpro = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    visibility = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterSongs", x => x.song_id);
                    table.ForeignKey(
                        name: "FK_MasterSongs_Users_creator_id",
                        column: x => x.creator_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SongVersions",
                columns: table => new
                {
                    version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    master_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    parent_version_id = table.Column<Guid>(type: "uuid", nullable: true),
                    artist = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    lyrics_chordpro = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    visibility = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongVersions", x => x.version_id);
                    table.ForeignKey(
                        name: "FK_SongVersions_MasterSongs_master_song_id",
                        column: x => x.master_song_id,
                        principalTable: "MasterSongs",
                        principalColumn: "song_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SongVersions_SongVersions_parent_version_id",
                        column: x => x.parent_version_id,
                        principalTable: "SongVersions",
                        principalColumn: "version_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SongVersions_Users_creator_id",
                        column: x => x.creator_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VersionTags",
                columns: table => new
                {
                    version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId1 = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VersionTags", x => new { x.version_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_VersionTags_SongVersions_version_id",
                        column: x => x.version_id,
                        principalTable: "SongVersions",
                        principalColumn: "version_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VersionTags_Tags_TagId1",
                        column: x => x.TagId1,
                        principalTable: "Tags",
                        principalColumn: "tag_id");
                    table.ForeignKey(
                        name: "FK_VersionTags_Tags_tag_id",
                        column: x => x.tag_id,
                        principalTable: "Tags",
                        principalColumn: "tag_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VersionVisibilities",
                columns: table => new
                {
                    version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChoirId1 = table.Column<Guid>(type: "uuid", nullable: true),
                    visibility_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VersionVisibilities", x => new { x.version_id, x.choir_id });
                    table.ForeignKey(
                        name: "FK_VersionVisibilities_Choirs_ChoirId1",
                        column: x => x.ChoirId1,
                        principalTable: "Choirs",
                        principalColumn: "choir_id");
                    table.ForeignKey(
                        name: "FK_VersionVisibilities_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VersionVisibilities_SongVersions_version_id",
                        column: x => x.version_id,
                        principalTable: "SongVersions",
                        principalColumn: "version_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistTemplateSongs_master_song_id",
                table: "PlaylistTemplateSongs",
                column: "master_song_id");

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistSongs_master_song_id",
                table: "PlaylistSongs",
                column: "master_song_id");

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistSongs_song_version_id",
                table: "PlaylistSongs",
                column: "song_version_id");

            migrationBuilder.CreateIndex(
                name: "IX_MasterSongs_creator_id",
                table: "MasterSongs",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_creator_id",
                table: "SongVersions",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_master_song_id_title",
                table: "SongVersions",
                columns: new[] { "master_song_id", "title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_parent_version_id",
                table: "SongVersions",
                column: "parent_version_id");

            migrationBuilder.CreateIndex(
                name: "IX_VersionTags_tag_id",
                table: "VersionTags",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "IX_VersionTags_TagId1",
                table: "VersionTags",
                column: "TagId1");

            migrationBuilder.CreateIndex(
                name: "IX_VersionVisibilities_choir_id",
                table: "VersionVisibilities",
                column: "choir_id");

            migrationBuilder.CreateIndex(
                name: "IX_VersionVisibilities_ChoirId1",
                table: "VersionVisibilities",
                column: "ChoirId1");

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistSongs_MasterSongs_master_song_id",
                table: "PlaylistSongs",
                column: "master_song_id",
                principalTable: "MasterSongs",
                principalColumn: "song_id");

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistSongs_SongVersions_song_version_id",
                table: "PlaylistSongs",
                column: "song_version_id",
                principalTable: "SongVersions",
                principalColumn: "version_id");

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistTemplateSongs_MasterSongs_master_song_id",
                table: "PlaylistTemplateSongs",
                column: "master_song_id",
                principalTable: "MasterSongs",
                principalColumn: "song_id");

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistTemplateSongs_SongVersions_song_version_id",
                table: "PlaylistTemplateSongs",
                column: "song_version_id",
                principalTable: "SongVersions",
                principalColumn: "version_id");

            migrationBuilder.AddForeignKey(
                name: "FK_SongTags_MasterSongs_song_id",
                table: "SongTags",
                column: "song_id",
                principalTable: "MasterSongs",
                principalColumn: "song_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SongVisibilities_MasterSongs_song_id",
                table: "SongVisibilities",
                column: "song_id",
                principalTable: "MasterSongs",
                principalColumn: "song_id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
