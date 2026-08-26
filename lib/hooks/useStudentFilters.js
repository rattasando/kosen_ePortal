"use client";

import { useState, useMemo, useEffect } from "react";
import { filterStudents, getLatestEnrollment } from "@/lib/utils/studentFilters";

const FILTER_KEY = "student-list-filters";

function loadFilters() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveFilters(data) {
  try {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/**
 * useStudentFilters — รวม filter state + sessionStorage + filtered list
 * ทั้งหมดสำหรับ StudentListClient
 *
 * @param {object[]} students — students ทั้งหมดจาก context
 * @returns {{
 *   // keyword search
 *   searchInput:       string,
 *   setSearchInput:    fn,
 *   keywords:          string[],
 *   setKeywords:       fn,
 *   addKeyword:        (kw: string) => void,
 *   removeKeyword:     (kw: string) => void,
 *   activeTerms:       string[],
 *   // dropdown filters
 *   filterStatus:      string,  setFilterStatus:      fn,
 *   filterUniversity:  string,  setFilterUniversity:  fn,
 *   filterYear:        string,  setFilterYear:        fn,
 *   filterScholarship: string,  setFilterScholarship: fn,
 *   filterSelfFunded:  boolean, setFilterSelfFunded:  fn,
 *   filterCountry:     string,  setFilterCountry:     fn,
 *   sortBy:            string,  setSortBy:            fn,
 *   // derived
 *   filtered:          object[],
 *   universities:      string[],
 *   scholarships:      string[],
 *   hasActiveFilter:   boolean,
 *   clearFilters:      () => void,
 * }}
 */
export function useStudentFilters(students) {
  // ── keyword search ────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [keywords, setKeywords] = useState(() => loadFilters().keywords ?? []);

  const activeTerms = useMemo(
    () => [...keywords, searchInput.trim()].filter(Boolean),
    [keywords, searchInput],
  );

  const addKeyword = (kw) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setKeywords((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSearchInput("");
  };

  const removeKeyword = (kw) => setKeywords((prev) => prev.filter((k) => k !== kw));

  // ── dropdown filters (with sessionStorage defaults) ───────────
  const [filterStatus, setFilterStatus]           = useState(() => loadFilters().filterStatus      ?? "ทั้งหมด");
  const [filterUniversity, setFilterUniversity]   = useState(() => loadFilters().filterUniversity  ?? "ทั้งหมด");
  const [filterYear, setFilterYear]               = useState(() => loadFilters().filterYear         ?? "ทั้งหมด");
  const [filterScholarship, setFilterScholarship] = useState(() => loadFilters().filterScholarship ?? "ทั้งหมด");
  const [filterSelfFunded, setFilterSelfFunded]   = useState(() => loadFilters().filterSelfFunded  ?? false);
  const [filterCountry, setFilterCountry]         = useState(() => loadFilters().filterCountry     ?? "ทั้งหมด");
  const [sortBy, setSortBy]                       = useState(() => loadFilters().sortBy            ?? "default");

  // ── persist to sessionStorage whenever any filter changes ─────
  useEffect(() => {
    saveFilters({
      keywords,
      filterStatus,
      filterUniversity,
      filterYear,
      filterScholarship,
      filterSelfFunded,
      filterCountry,
      sortBy,
    });
  }, [keywords, filterStatus, filterUniversity, filterYear, filterScholarship, filterSelfFunded, filterCountry, sortBy]);

  // ── derived option lists ──────────────────────────────────────
  const universities = useMemo(() => {
    const unique = [
      ...new Set(
        students.map((s) => getLatestEnrollment(s).university).filter(Boolean),
      ),
    ];
    return ["ทั้งหมด", ...unique];
  }, [students]);

  const scholarships = useMemo(() => {
    const unique = [
      ...new Set(students.map((s) => s.scholarship).filter(Boolean)),
    ].sort();
    return ["ทั้งหมด", ...unique];
  }, [students]);

  // ── filtered list ─────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      filterStudents(students, {
        keywords,
        searchInput,
        filterStatus,
        filterUniversity,
        filterYear,
        filterScholarship,
        filterSelfFunded,
        filterCountry,
        sortBy,
      }),
    [
      students,
      keywords,
      searchInput,
      filterStatus,
      filterUniversity,
      filterYear,
      filterScholarship,
      filterSelfFunded,
      filterCountry,
      sortBy,
    ],
  );

  // ── derived booleans ─────────────────────────────────────────
  const hasActiveFilter =
    keywords.length > 0 ||
    filterStatus !== "ทั้งหมด" ||
    filterUniversity !== "ทั้งหมด" ||
    filterYear !== "ทั้งหมด" ||
    filterScholarship !== "ทั้งหมด" ||
    filterSelfFunded ||
    filterCountry !== "ทั้งหมด" ||
    sortBy !== "default";

  const clearFilters = () => {
    setKeywords([]);
    setSearchInput("");
    setFilterStatus("ทั้งหมด");
    setFilterUniversity("ทั้งหมด");
    setFilterYear("ทั้งหมด");
    setFilterScholarship("ทั้งหมด");
    setFilterSelfFunded(false);
    setFilterCountry("ทั้งหมด");
    setSortBy("default");
  };

  return {
    // keyword
    searchInput, setSearchInput,
    keywords, setKeywords,
    addKeyword, removeKeyword,
    activeTerms,
    // dropdowns
    filterStatus, setFilterStatus,
    filterUniversity, setFilterUniversity,
    filterYear, setFilterYear,
    filterScholarship, setFilterScholarship,
    filterSelfFunded, setFilterSelfFunded,
    filterCountry, setFilterCountry,
    sortBy, setSortBy,
    // derived
    filtered,
    universities,
    scholarships,
    hasActiveFilter,
    clearFilters,
  };
}
