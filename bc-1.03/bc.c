
/* A Bison parser, made by GNU Bison 2.4.1.  */

/* Skeleton implementation for Bison's Yacc-like parsers in C
   
      Copyright (C) 1984, 1989, 1990, 2000, 2001, 2002, 2003, 2004, 2005, 2006
   Free Software Foundation, Inc.
   
   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.
   
   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* C LALR(1) parser skeleton written by Richard Stallman, by
   simplifying the original so-called "semantic" parser.  */

/* All symbols defined below should begin with yy or YY, to avoid
   infringing on user name space.  This should be done even for local
   variables, as they might otherwise be expanded by user macros.
   There are some unavoidable exceptions within include files to
   define necessary library symbols; they are noted "INFRINGES ON
   USER NAME SPACE" below.  */

/* Identify Bison output.  */
#define YYBISON 1

/* Bison version.  */
#define YYBISON_VERSION "2.4.1"

/* Skeleton name.  */
#define YYSKELETON_NAME "yacc.c"

/* Pure parsers.  */
#define YYPURE 0

/* Push parsers.  */
#define YYPUSH 0

/* Pull parsers.  */
#define YYPULL 1

/* Using locations.  */
#define YYLSP_NEEDED 0



/* Copy the first part of user declarations.  */

/* Line 189 of yacc.c  */
#line 1 "bc.y"

/* bc.y: The grammar for a POSIX compatable bc processor with some
         extensions to the language. */

/*  This file is part of bc written for MINIX.
    Copyright (C) 1991, 1992, 1993, 1994 Free Software Foundation, Inc.

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License , or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; see the file COPYING.  If not, write to
    the Free Software Foundation, 675 Mass Ave, Cambridge, MA 02139, USA.

    You may contact the author by:
       e-mail:  phil@cs.wwu.edu
      us-mail:  Philip A. Nelson
                Computer Science Department, 9062
                Western Washington University
                Bellingham, WA 98226-9062
       
*************************************************************************/

#include "bcdefs.h"
#include "global.h"
#include "proto.h"


/* Line 189 of yacc.c  */
#line 109 "y.tab.c"

/* Enabling traces.  */
#ifndef YYDEBUG
# define YYDEBUG 0
#endif

/* Enabling verbose error messages.  */
#ifdef YYERROR_VERBOSE
# undef YYERROR_VERBOSE
# define YYERROR_VERBOSE 1
#else
# define YYERROR_VERBOSE 0
#endif

/* Enabling the token table.  */
#ifndef YYTOKEN_TABLE
# define YYTOKEN_TABLE 0
#endif


/* Tokens.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
   /* Put the tokens into the symbol table, so that GDB and other debuggers
      know about them.  */
   enum yytokentype {
     NEWLINE = 258,
     AND = 259,
     OR = 260,
     NOT = 261,
     STRING = 262,
     NAME = 263,
     NUMBER = 264,
     MUL_OP = 265,
     ASSIGN_OP = 266,
     REL_OP = 267,
     INCR_DECR = 268,
     Define = 269,
     Break = 270,
     Quit = 271,
     Length = 272,
     Return = 273,
     For = 274,
     If = 275,
     While = 276,
     Sqrt = 277,
     Else = 278,
     Scale = 279,
     Ibase = 280,
     Obase = 281,
     Auto = 282,
     Read = 283,
     Warranty = 284,
     Halt = 285,
     Last = 286,
     Continue = 287,
     Print = 288,
     Limits = 289,
     UNARY_MINUS = 290
   };
#endif
/* Tokens.  */
#define NEWLINE 258
#define AND 259
#define OR 260
#define NOT 261
#define STRING 262
#define NAME 263
#define NUMBER 264
#define MUL_OP 265
#define ASSIGN_OP 266
#define REL_OP 267
#define INCR_DECR 268
#define Define 269
#define Break 270
#define Quit 271
#define Length 272
#define Return 273
#define For 274
#define If 275
#define While 276
#define Sqrt 277
#define Else 278
#define Scale 279
#define Ibase 280
#define Obase 281
#define Auto 282
#define Read 283
#define Warranty 284
#define Halt 285
#define Last 286
#define Continue 287
#define Print 288
#define Limits 289
#define UNARY_MINUS 290




#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
typedef union YYSTYPE
{

/* Line 214 of yacc.c  */
#line 38 "bc.y"

	char	 *s_value;
	char	  c_value;
	int	  i_value;
	arg_list *a_value;
       


/* Line 214 of yacc.c  */
#line 224 "y.tab.c"
} YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define yystype YYSTYPE /* obsolescent; will be withdrawn */
# define YYSTYPE_IS_DECLARED 1
#endif


/* Copy the second part of user declarations.  */


/* Line 264 of yacc.c  */
#line 236 "y.tab.c"

#ifdef short
# undef short
#endif

#ifdef YYTYPE_UINT8
typedef YYTYPE_UINT8 yytype_uint8;
#else
typedef unsigned char yytype_uint8;
#endif

#ifdef YYTYPE_INT8
typedef YYTYPE_INT8 yytype_int8;
#elif (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
typedef signed char yytype_int8;
#else
typedef short int yytype_int8;
#endif

#ifdef YYTYPE_UINT16
typedef YYTYPE_UINT16 yytype_uint16;
#else
typedef unsigned short int yytype_uint16;
#endif

#ifdef YYTYPE_INT16
typedef YYTYPE_INT16 yytype_int16;
#else
typedef short int yytype_int16;
#endif

#ifndef YYSIZE_T
# ifdef __SIZE_TYPE__
#  define YYSIZE_T __SIZE_TYPE__
# elif defined size_t
#  define YYSIZE_T size_t
# elif ! defined YYSIZE_T && (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
#  include <stddef.h> /* INFRINGES ON USER NAME SPACE */
#  define YYSIZE_T size_t
# else
#  define YYSIZE_T unsigned int
# endif
#endif

#define YYSIZE_MAXIMUM ((YYSIZE_T) -1)

#ifndef YY_
# if YYENABLE_NLS
#  if ENABLE_NLS
#   include <libintl.h> /* INFRINGES ON USER NAME SPACE */
#   define YY_(msgid) dgettext ("bison-runtime", msgid)
#  endif
# endif
# ifndef YY_
#  define YY_(msgid) msgid
# endif
#endif

/* Suppress unused-variable warnings by "using" E.  */
#if ! defined lint || defined __GNUC__
# define YYUSE(e) ((void) (e))
#else
# define YYUSE(e) /* empty */
#endif

/* Identity function, used to suppress warnings about constant conditions.  */
#ifndef lint
# define YYID(n) (n)
#else
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static int
YYID (int yyi)
#else
static int
YYID (yyi)
    int yyi;
#endif
{
  return yyi;
}
#endif

#if ! defined yyoverflow || YYERROR_VERBOSE

/* The parser invokes alloca or malloc; define the necessary symbols.  */

# ifdef YYSTACK_USE_ALLOCA
#  if YYSTACK_USE_ALLOCA
#   ifdef __GNUC__
#    define YYSTACK_ALLOC __builtin_alloca
#   elif defined __BUILTIN_VA_ARG_INCR
#    include <alloca.h> /* INFRINGES ON USER NAME SPACE */
#   elif defined _AIX
#    define YYSTACK_ALLOC __alloca
#   elif defined _MSC_VER
#    include <malloc.h> /* INFRINGES ON USER NAME SPACE */
#    define alloca _alloca
#   else
#    define YYSTACK_ALLOC alloca
#    if ! defined _ALLOCA_H && ! defined _STDLIB_H && (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
#     include <stdlib.h> /* INFRINGES ON USER NAME SPACE */
#     ifndef _STDLIB_H
#      define _STDLIB_H 1
#     endif
#    endif
#   endif
#  endif
# endif

# ifdef YYSTACK_ALLOC
   /* Pacify GCC's `empty if-body' warning.  */
#  define YYSTACK_FREE(Ptr) do { /* empty */; } while (YYID (0))
#  ifndef YYSTACK_ALLOC_MAXIMUM
    /* The OS might guarantee only one guard page at the bottom of the stack,
       and a page size can be as small as 4096 bytes.  So we cannot safely
       invoke alloca (N) if N exceeds 4096.  Use a slightly smaller number
       to allow for a few compiler-allocated temporary stack slots.  */
#   define YYSTACK_ALLOC_MAXIMUM 4032 /* reasonable circa 2006 */
#  endif
# else
#  define YYSTACK_ALLOC YYMALLOC
#  define YYSTACK_FREE YYFREE
#  ifndef YYSTACK_ALLOC_MAXIMUM
#   define YYSTACK_ALLOC_MAXIMUM YYSIZE_MAXIMUM
#  endif
#  if (defined __cplusplus && ! defined _STDLIB_H \
       && ! ((defined YYMALLOC || defined malloc) \
	     && (defined YYFREE || defined free)))
#   include <stdlib.h> /* INFRINGES ON USER NAME SPACE */
#   ifndef _STDLIB_H
#    define _STDLIB_H 1
#   endif
#  endif
#  ifndef YYMALLOC
#   define YYMALLOC malloc
#   if ! defined malloc && ! defined _STDLIB_H && (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
void *malloc (YYSIZE_T); /* INFRINGES ON USER NAME SPACE */
#   endif
#  endif
#  ifndef YYFREE
#   define YYFREE free
#   if ! defined free && ! defined _STDLIB_H && (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
void free (void *); /* INFRINGES ON USER NAME SPACE */
#   endif
#  endif
# endif
#endif /* ! defined yyoverflow || YYERROR_VERBOSE */


#if (! defined yyoverflow \
     && (! defined __cplusplus \
	 || (defined YYSTYPE_IS_TRIVIAL && YYSTYPE_IS_TRIVIAL)))

/* A type that is properly aligned for any stack member.  */
union yyalloc
{
  yytype_int16 yyss_alloc;
  YYSTYPE yyvs_alloc;
};

/* The size of the maximum gap between one aligned stack and the next.  */
# define YYSTACK_GAP_MAXIMUM (sizeof (union yyalloc) - 1)

/* The size of an array large to enough to hold all stacks, each with
   N elements.  */
# define YYSTACK_BYTES(N) \
     ((N) * (sizeof (yytype_int16) + sizeof (YYSTYPE)) \
      + YYSTACK_GAP_MAXIMUM)

/* Copy COUNT objects from FROM to TO.  The source and destination do
   not overlap.  */
# ifndef YYCOPY
#  if defined __GNUC__ && 1 < __GNUC__
#   define YYCOPY(To, From, Count) \
      __builtin_memcpy (To, From, (Count) * sizeof (*(From)))
#  else
#   define YYCOPY(To, From, Count)		\
      do					\
	{					\
	  YYSIZE_T yyi;				\
	  for (yyi = 0; yyi < (Count); yyi++)	\
	    (To)[yyi] = (From)[yyi];		\
	}					\
      while (YYID (0))
#  endif
# endif

/* Relocate STACK from its old location to the new one.  The
   local variables YYSIZE and YYSTACKSIZE give the old and new number of
   elements in the stack, and YYPTR gives the new location of the
   stack.  Advance YYPTR to a properly aligned location for the next
   stack.  */
# define YYSTACK_RELOCATE(Stack_alloc, Stack)				\
    do									\
      {									\
	YYSIZE_T yynewbytes;						\
	YYCOPY (&yyptr->Stack_alloc, Stack, yysize);			\
	Stack = &yyptr->Stack_alloc;					\
	yynewbytes = yystacksize * sizeof (*Stack) + YYSTACK_GAP_MAXIMUM; \
	yyptr += yynewbytes / sizeof (*yyptr);				\
      }									\
    while (YYID (0))

#endif

/* YYFINAL -- State number of the termination state.  */
#define YYFINAL  2
/* YYLAST -- Last index in YYTABLE.  */
#define YYLAST   616

/* YYNTOKENS -- Number of terminals.  */
#define YYNTOKENS  47
/* YYNNTS -- Number of nonterminals.  */
#define YYNNTS  33
/* YYNRULES -- Number of rules.  */
#define YYNRULES  98
/* YYNRULES -- Number of states.  */
#define YYNSTATES  166

/* YYTRANSLATE(YYLEX) -- Bison symbol number corresponding to YYLEX.  */
#define YYUNDEFTOK  2
#define YYMAXUTOK   290

#define YYTRANSLATE(YYX)						\
  ((unsigned int) (YYX) <= YYMAXUTOK ? yytranslate[YYX] : YYUNDEFTOK)

/* YYTRANSLATE[YYLEX] -- Bison symbol number corresponding to YYLEX.  */
static const yytype_uint8 yytranslate[] =
{
       0,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
      40,    41,     2,    35,    44,    36,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,    39,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,    45,     2,    46,    37,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,    42,     2,    43,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     1,     2,     3,     4,
       5,     6,     7,     8,     9,    10,    11,    12,    13,    14,
      15,    16,    17,    18,    19,    20,    21,    22,    23,    24,
      25,    26,    27,    28,    29,    30,    31,    32,    33,    34,
      38
};

#if YYDEBUG
/* YYPRHS[YYN] -- Index of the first RHS symbol of rule number YYN in
   YYRHS.  */
static const yytype_uint16 yyprhs[] =
{
       0,     0,     3,     4,     7,    10,    12,    15,    16,    18,
      22,    25,    26,    28,    31,    35,    38,    42,    44,    47,
      49,    51,    53,    55,    57,    59,    61,    63,    65,    70,
      71,    72,    73,    74,    88,    89,    97,    98,    99,   107,
     111,   112,   116,   118,   122,   124,   126,   127,   128,   132,
     133,   145,   146,   148,   149,   153,   157,   159,   163,   167,
     173,   174,   176,   178,   182,   186,   192,   193,   195,   196,
     198,   199,   204,   205,   210,   211,   216,   219,   223,   227,
     231,   235,   239,   242,   244,   246,   250,   255,   258,   261,
     266,   271,   276,   280,   282,   287,   289,   291,   293
};

/* YYRHS -- A `-1'-separated list of the rules' RHS.  */
static const yytype_int8 yyrhs[] =
{
      48,     0,    -1,    -1,    48,    49,    -1,    50,     3,    -1,
      66,    -1,     1,     3,    -1,    -1,    52,    -1,    50,    39,
      52,    -1,    50,    39,    -1,    -1,    52,    -1,    51,     3,
      -1,    51,     3,    52,    -1,    51,    39,    -1,    51,    39,
      53,    -1,    53,    -1,     1,    53,    -1,    29,    -1,    34,
      -1,    75,    -1,     7,    -1,    15,    -1,    32,    -1,    16,
      -1,    30,    -1,    18,    -1,    18,    40,    74,    41,    -1,
      -1,    -1,    -1,    -1,    19,    54,    40,    73,    39,    55,
      73,    39,    56,    73,    41,    57,    53,    -1,    -1,    20,
      40,    75,    41,    58,    53,    64,    -1,    -1,    -1,    21,
      59,    40,    75,    60,    41,    53,    -1,    42,    51,    43,
      -1,    -1,    33,    61,    62,    -1,    63,    -1,    63,    44,
      62,    -1,     7,    -1,    75,    -1,    -1,    -1,    23,    65,
      53,    -1,    -1,    14,     8,    40,    68,    41,    42,     3,
      69,    67,    51,    43,    -1,    -1,    70,    -1,    -1,    27,
      70,     3,    -1,    27,    70,    39,    -1,     8,    -1,     8,
      45,    46,    -1,    70,    44,     8,    -1,    70,    44,     8,
      45,    46,    -1,    -1,    72,    -1,    75,    -1,     8,    45,
      46,    -1,    72,    44,    75,    -1,    72,    44,     8,    45,
      46,    -1,    -1,    75,    -1,    -1,    75,    -1,    -1,    79,
      11,    76,    75,    -1,    -1,    75,     4,    77,    75,    -1,
      -1,    75,     5,    78,    75,    -1,     6,    75,    -1,    75,
      12,    75,    -1,    75,    35,    75,    -1,    75,    36,    75,
      -1,    75,    10,    75,    -1,    75,    37,    75,    -1,    36,
      75,    -1,    79,    -1,     9,    -1,    40,    75,    41,    -1,
       8,    40,    71,    41,    -1,    13,    79,    -1,    79,    13,
      -1,    17,    40,    75,    41,    -1,    22,    40,    75,    41,
      -1,    24,    40,    75,    41,    -1,    28,    40,    41,    -1,
       8,    -1,     8,    45,    75,    46,    -1,    25,    -1,    26,
      -1,    24,    -1,    31,    -1
};

/* YYRLINE[YYN] -- source line where rule number YYN was defined.  */
static const yytype_uint16 yyrline[] =
{
       0,   106,   106,   114,   116,   118,   120,   127,   128,   129,
     130,   133,   134,   135,   136,   137,   138,   140,   141,   144,
     146,   148,   157,   164,   174,   185,   187,   189,   191,   194,
     199,   210,   221,   193,   239,   238,   252,   258,   251,   270,
     273,   272,   276,   277,   279,   285,   288,   290,   289,   300,
     298,   319,   320,   323,   324,   326,   329,   331,   333,   335,
     339,   340,   342,   347,   353,   358,   366,   370,   373,   377,
     384,   383,   411,   410,   424,   423,   439,   445,   473,   478,
     483,   490,   495,   500,   509,   525,   527,   543,   562,   585,
     587,   589,   591,   597,   599,   604,   606,   608,   610
};
#endif

#if YYDEBUG || YYERROR_VERBOSE || YYTOKEN_TABLE
/* YYTNAME[SYMBOL-NUM] -- String name of the symbol SYMBOL-NUM.
   First, the terminals, then, starting at YYNTOKENS, nonterminals.  */
static const char *const yytname[] =
{
  "$end", "error", "$undefined", "NEWLINE", "AND", "OR", "NOT", "STRING",
  "NAME", "NUMBER", "MUL_OP", "ASSIGN_OP", "REL_OP", "INCR_DECR", "Define",
  "Break", "Quit", "Length", "Return", "For", "If", "While", "Sqrt",
  "Else", "Scale", "Ibase", "Obase", "Auto", "Read", "Warranty", "Halt",
  "Last", "Continue", "Print", "Limits", "'+'", "'-'", "'^'",
  "UNARY_MINUS", "';'", "'('", "')'", "'{'", "'}'", "','", "'['", "']'",
  "$accept", "program", "input_item", "semicolon_list", "statement_list",
  "statement_or_error", "statement", "$@1", "$@2", "@3", "$@4", "$@5",
  "$@6", "$@7", "$@8", "print_list", "print_element", "opt_else", "$@9",
  "function", "$@10", "opt_parameter_list", "opt_auto_define_list",
  "define_list", "opt_argument_list", "argument_list", "opt_expression",
  "return_expression", "expression", "$@11", "$@12", "$@13",
  "named_expression", 0
};
#endif

# ifdef YYPRINT
/* YYTOKNUM[YYLEX-NUM] -- Internal token number corresponding to
   token YYLEX-NUM.  */
static const yytype_uint16 yytoknum[] =
{
       0,   256,   257,   258,   259,   260,   261,   262,   263,   264,
     265,   266,   267,   268,   269,   270,   271,   272,   273,   274,
     275,   276,   277,   278,   279,   280,   281,   282,   283,   284,
     285,   286,   287,   288,   289,    43,    45,    94,   290,    59,
      40,    41,   123,   125,    44,    91,    93
};
# endif

/* YYR1[YYN] -- Symbol number of symbol that rule YYN derives.  */
static const yytype_uint8 yyr1[] =
{
       0,    47,    48,    48,    49,    49,    49,    50,    50,    50,
      50,    51,    51,    51,    51,    51,    51,    52,    52,    53,
      53,    53,    53,    53,    53,    53,    53,    53,    53,    54,
      55,    56,    57,    53,    58,    53,    59,    60,    53,    53,
      61,    53,    62,    62,    63,    63,    64,    65,    64,    67,
      66,    68,    68,    69,    69,    69,    70,    70,    70,    70,
      71,    71,    72,    72,    72,    72,    73,    73,    74,    74,
      76,    75,    77,    75,    78,    75,    75,    75,    75,    75,
      75,    75,    75,    75,    75,    75,    75,    75,    75,    75,
      75,    75,    75,    79,    79,    79,    79,    79,    79
};

/* YYR2[YYN] -- Number of symbols composing right hand side of rule YYN.  */
static const yytype_uint8 yyr2[] =
{
       0,     2,     0,     2,     2,     1,     2,     0,     1,     3,
       2,     0,     1,     2,     3,     2,     3,     1,     2,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     4,     0,
       0,     0,     0,    13,     0,     7,     0,     0,     7,     3,
       0,     3,     1,     3,     1,     1,     0,     0,     3,     0,
      11,     0,     1,     0,     3,     3,     1,     3,     3,     5,
       0,     1,     1,     3,     3,     5,     0,     1,     0,     1,
       0,     4,     0,     4,     0,     4,     2,     3,     3,     3,
       3,     3,     2,     1,     1,     3,     4,     2,     2,     4,
       4,     4,     3,     1,     4,     1,     1,     1,     1
};

/* YYDEFACT[STATE-NAME] -- Default rule to reduce with in state
   STATE-NUM when YYTABLE doesn't specify something else to do.  Zero
   means the default is an error.  */
static const yytype_uint8 yydefact[] =
{
       2,     0,     1,     0,     0,    22,    93,    84,     0,     0,
      23,    25,     0,    27,    29,     0,    36,     0,    97,    95,
      96,     0,    19,    26,    98,    24,    40,    20,     0,     0,
       0,     3,     0,     8,    17,     5,    21,    83,     6,    18,
      76,    60,     0,    93,    97,    87,     0,     0,    68,     0,
       0,     0,     0,     0,     0,     0,    82,     0,     0,     0,
      12,     4,     0,    72,    74,     0,     0,     0,     0,     0,
      70,    88,    93,     0,    61,    62,     0,    51,     0,     0,
      69,    66,     0,     0,     0,     0,    92,    44,    41,    42,
      45,    85,     0,    15,    39,     9,     0,     0,    80,    77,
      78,    79,    81,     0,     0,    86,     0,    94,    56,     0,
      52,    89,    28,     0,    67,    34,    37,    90,    91,     0,
      14,    16,    73,    75,    71,    63,    93,    64,     0,     0,
       0,    30,     0,     0,    43,     0,    57,     0,    58,    66,
      46,     0,    65,    53,     0,     0,    47,    35,    38,     0,
      49,    59,    31,     0,     0,     0,    66,    48,    54,    55,
       0,     0,    50,    32,     0,    33
};

/* YYDEFGOTO[NTERM-NUM].  */
static const yytype_int16 yydefgoto[] =
{
      -1,     1,    31,    32,    59,    60,    34,    49,   139,   156,
     164,   132,    51,   133,    55,    88,    89,   147,   153,    35,
     155,   109,   150,   110,    73,    74,   113,    79,    36,   103,
      96,    97,    37
};

/* YYPACT[STATE-NUM] -- Index in YYTABLE of the portion describing
   STATE-NUM.  */
#define YYPACT_NINF -125
static const yytype_int16 yypact[] =
{
    -125,   156,  -125,   352,   534,  -125,   -31,  -125,    49,     2,
    -125,  -125,   -19,   -17,  -125,   -15,  -125,    -5,    19,  -125,
    -125,    20,  -125,  -125,  -125,  -125,  -125,  -125,   534,   534,
     196,  -125,     4,  -125,  -125,  -125,    73,     9,  -125,  -125,
     110,   555,   534,   -12,  -125,  -125,    21,   534,   534,    28,
     534,    29,   534,   534,    30,   513,  -125,   385,   476,    13,
    -125,  -125,   282,  -125,  -125,   534,   534,   534,   534,   534,
    -125,  -125,   -28,    31,   -10,    73,     1,    33,   394,    35,
      73,   534,   397,   534,   406,   440,  -125,  -125,  -125,    26,
      73,  -125,   239,   476,  -125,  -125,   534,   534,    45,    -7,
      -6,    -6,    45,   534,    90,  -125,   576,  -125,    39,    46,
      42,  -125,  -125,     3,    73,  -125,    73,  -125,  -125,   513,
    -125,  -125,   110,   131,    -7,  -125,   -21,    73,    43,    51,
      80,  -125,   476,    50,  -125,   317,  -125,    94,    55,   534,
      82,   476,  -125,    79,    65,    74,  -125,  -125,  -125,    33,
    -125,  -125,  -125,   476,     5,   196,   534,  -125,  -125,  -125,
      15,    78,  -125,  -125,   476,  -125
};

/* YYPGOTO[NTERM-NUM].  */
static const yytype_int8 yypgoto[] =
{
    -125,  -125,  -125,  -125,   -32,     0,    -3,  -125,  -125,  -125,
    -125,  -125,  -125,  -125,  -125,     6,  -125,  -125,  -125,  -125,
    -125,  -125,  -125,   -25,  -125,  -125,  -124,  -125,    -2,  -125,
    -125,  -125,   119
};

/* YYTABLE[YYPACT[STATE-NUM]].  What to do in state STATE-NUM.  If
   positive, shift that token.  If negative, reduce the rule which
   number is the opposite.  If zero, do what YYDEFACT says.
   If YYTABLE_NINF, syntax error.  */
#define YYTABLE_NINF -14
static const yytype_int16 yytable[] =
{
      39,    33,    40,    65,    65,    63,    64,    61,   158,    41,
      46,    65,    41,    66,    42,   145,    92,   104,    92,    41,
      70,    47,    71,    48,   135,    50,    56,    57,    67,    68,
      69,    69,   161,    42,   106,    52,    67,    68,    69,    75,
      76,   108,   131,    62,   159,    78,    80,   107,    82,   130,
      84,    85,    93,    90,    93,    39,    94,    43,   162,    53,
      54,    77,    95,    98,    99,   100,   101,   102,    81,    83,
     119,    86,   105,    44,    19,    20,   112,    63,    64,   114,
      24,   116,    69,    65,   128,    66,   130,   129,   138,   136,
     121,   141,   120,   137,   122,   123,     4,   143,     6,     7,
     144,   124,    76,     8,   127,   146,   149,    12,    67,    68,
      69,   151,    17,   152,    18,    19,    20,    90,    21,   163,
      65,    24,    66,   160,   154,   134,    28,    45,     0,   140,
      29,     0,     0,    76,     0,    63,   125,   114,   148,     0,
       0,    65,     0,    66,     0,    67,    68,    69,     0,     0,
     157,     0,     0,     0,   114,     0,     2,     3,     0,    -7,
       0,   165,     4,     5,     6,     7,    67,    68,    69,     8,
       9,    10,    11,    12,    13,    14,    15,    16,    17,     0,
      18,    19,    20,     0,    21,    22,    23,    24,    25,    26,
      27,     0,    28,     0,     0,    -7,    29,    58,    30,   -11,
       0,     0,     4,     5,     6,     7,     0,     0,     0,     8,
       0,    10,    11,    12,    13,    14,    15,    16,    17,     0,
      18,    19,    20,     0,    21,    22,    23,    24,    25,    26,
      27,     0,    28,     0,     0,   -11,    29,     0,    30,   -11,
      58,     0,   -13,     0,     0,     4,     5,     6,     7,     0,
       0,     0,     8,     0,    10,    11,    12,    13,    14,    15,
      16,    17,     0,    18,    19,    20,     0,    21,    22,    23,
      24,    25,    26,    27,     0,    28,     0,     0,   -13,    29,
       0,    30,   -13,    58,     0,   -10,     0,     0,     4,     5,
       6,     7,     0,     0,     0,     8,     0,    10,    11,    12,
      13,    14,    15,    16,    17,     0,    18,    19,    20,     0,
      21,    22,    23,    24,    25,    26,    27,     0,    28,     0,
       0,   -10,    29,     4,    30,     6,     7,     0,     0,     0,
       8,     0,     0,     0,    12,     0,     0,     0,     0,    17,
       0,    18,    19,    20,     0,    21,     0,     0,    24,     0,
       0,     0,     0,    28,     0,    38,     0,    29,     4,     5,
       6,     7,     0,   142,     0,     8,     0,    10,    11,    12,
      13,    14,    15,    16,    17,     0,    18,    19,    20,     0,
      21,    22,    23,    24,    25,    26,    27,     0,    28,    63,
      64,     0,    29,     0,    30,    65,     0,    66,    63,    64,
       0,    63,    64,     0,    65,     0,    66,    65,     0,    66,
      63,    64,     0,     0,     0,     0,    65,     0,    66,     0,
      67,    68,    69,     0,     0,     0,    91,     0,     0,    67,
      68,    69,    67,    68,    69,   111,     0,     0,   115,     0,
       0,    67,    68,    69,    63,    64,     0,   117,     0,     0,
      65,     0,    66,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,    67,    68,    69,     0,     0,
       0,   118,     4,     5,     6,     7,     0,     0,     0,     8,
       0,    10,    11,    12,    13,    14,    15,    16,    17,     0,
      18,    19,    20,     0,    21,    22,    23,    24,    25,    26,
      27,     0,    28,     0,     0,     0,    29,     0,    30,     4,
      87,     6,     7,     0,     0,     0,     8,     0,     0,     0,
      12,     0,     0,     0,     0,    17,     0,    18,    19,    20,
       4,    21,     6,     7,    24,     0,     0,     8,     0,    28,
       0,    12,     0,    29,     0,     0,    17,     0,    18,    19,
      20,     4,    21,    72,     7,    24,     0,     0,     8,     0,
      28,     0,    12,     0,    29,     0,     0,    17,     0,    18,
      19,    20,     4,    21,   126,     7,    24,     0,     0,     8,
       0,    28,     0,    12,     0,    29,     0,     0,    17,     0,
      18,    19,    20,     0,    21,     0,     0,    24,     0,     0,
       0,     0,    28,     0,     0,     0,    29
};

static const yytype_int16 yycheck[] =
{
       3,     1,     4,    10,    10,     4,     5,     3,     3,    40,
       8,    10,    40,    12,    45,   139,     3,    45,     3,    40,
      11,    40,    13,    40,    45,    40,    28,    29,    35,    36,
      37,    37,   156,    45,    44,    40,    35,    36,    37,    41,
      42,     8,    39,    39,    39,    47,    48,    46,    50,    44,
      52,    53,    39,    55,    39,    58,    43,     8,    43,    40,
      40,    40,    62,    65,    66,    67,    68,    69,    40,    40,
      44,    41,    41,    24,    25,    26,    41,     4,     5,    81,
      31,    83,    37,    10,    45,    12,    44,    41,     8,    46,
      93,    41,    92,    42,    96,    97,     6,     3,     8,     9,
      45,   103,   104,    13,   106,    23,    27,    17,    35,    36,
      37,    46,    22,    39,    24,    25,    26,   119,    28,    41,
      10,    31,    12,   155,   149,   119,    36,     8,    -1,   132,
      40,    -1,    -1,   135,    -1,     4,    46,   139,   141,    -1,
      -1,    10,    -1,    12,    -1,    35,    36,    37,    -1,    -1,
     153,    -1,    -1,    -1,   156,    -1,     0,     1,    -1,     3,
      -1,   164,     6,     7,     8,     9,    35,    36,    37,    13,
      14,    15,    16,    17,    18,    19,    20,    21,    22,    -1,
      24,    25,    26,    -1,    28,    29,    30,    31,    32,    33,
      34,    -1,    36,    -1,    -1,    39,    40,     1,    42,     3,
      -1,    -1,     6,     7,     8,     9,    -1,    -1,    -1,    13,
      -1,    15,    16,    17,    18,    19,    20,    21,    22,    -1,
      24,    25,    26,    -1,    28,    29,    30,    31,    32,    33,
      34,    -1,    36,    -1,    -1,    39,    40,    -1,    42,    43,
       1,    -1,     3,    -1,    -1,     6,     7,     8,     9,    -1,
      -1,    -1,    13,    -1,    15,    16,    17,    18,    19,    20,
      21,    22,    -1,    24,    25,    26,    -1,    28,    29,    30,
      31,    32,    33,    34,    -1,    36,    -1,    -1,    39,    40,
      -1,    42,    43,     1,    -1,     3,    -1,    -1,     6,     7,
       8,     9,    -1,    -1,    -1,    13,    -1,    15,    16,    17,
      18,    19,    20,    21,    22,    -1,    24,    25,    26,    -1,
      28,    29,    30,    31,    32,    33,    34,    -1,    36,    -1,
      -1,    39,    40,     6,    42,     8,     9,    -1,    -1,    -1,
      13,    -1,    -1,    -1,    17,    -1,    -1,    -1,    -1,    22,
      -1,    24,    25,    26,    -1,    28,    -1,    -1,    31,    -1,
      -1,    -1,    -1,    36,    -1,     3,    -1,    40,     6,     7,
       8,     9,    -1,    46,    -1,    13,    -1,    15,    16,    17,
      18,    19,    20,    21,    22,    -1,    24,    25,    26,    -1,
      28,    29,    30,    31,    32,    33,    34,    -1,    36,     4,
       5,    -1,    40,    -1,    42,    10,    -1,    12,     4,     5,
      -1,     4,     5,    -1,    10,    -1,    12,    10,    -1,    12,
       4,     5,    -1,    -1,    -1,    -1,    10,    -1,    12,    -1,
      35,    36,    37,    -1,    -1,    -1,    41,    -1,    -1,    35,
      36,    37,    35,    36,    37,    41,    -1,    -1,    41,    -1,
      -1,    35,    36,    37,     4,     5,    -1,    41,    -1,    -1,
      10,    -1,    12,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    35,    36,    37,    -1,    -1,
      -1,    41,     6,     7,     8,     9,    -1,    -1,    -1,    13,
      -1,    15,    16,    17,    18,    19,    20,    21,    22,    -1,
      24,    25,    26,    -1,    28,    29,    30,    31,    32,    33,
      34,    -1,    36,    -1,    -1,    -1,    40,    -1,    42,     6,
       7,     8,     9,    -1,    -1,    -1,    13,    -1,    -1,    -1,
      17,    -1,    -1,    -1,    -1,    22,    -1,    24,    25,    26,
       6,    28,     8,     9,    31,    -1,    -1,    13,    -1,    36,
      -1,    17,    -1,    40,    -1,    -1,    22,    -1,    24,    25,
      26,     6,    28,     8,     9,    31,    -1,    -1,    13,    -1,
      36,    -1,    17,    -1,    40,    -1,    -1,    22,    -1,    24,
      25,    26,     6,    28,     8,     9,    31,    -1,    -1,    13,
      -1,    36,    -1,    17,    -1,    40,    -1,    -1,    22,    -1,
      24,    25,    26,    -1,    28,    -1,    -1,    31,    -1,    -1,
      -1,    -1,    36,    -1,    -1,    -1,    40
};

/* YYSTOS[STATE-NUM] -- The (internal number of the) accessing
   symbol of state STATE-NUM.  */
static const yytype_uint8 yystos[] =
{
       0,    48,     0,     1,     6,     7,     8,     9,    13,    14,
      15,    16,    17,    18,    19,    20,    21,    22,    24,    25,
      26,    28,    29,    30,    31,    32,    33,    34,    36,    40,
      42,    49,    50,    52,    53,    66,    75,    79,     3,    53,
      75,    40,    45,     8,    24,    79,     8,    40,    40,    54,
      40,    59,    40,    40,    40,    61,    75,    75,     1,    51,
      52,     3,    39,     4,     5,    10,    12,    35,    36,    37,
      11,    13,     8,    71,    72,    75,    75,    40,    75,    74,
      75,    40,    75,    40,    75,    75,    41,     7,    62,    63,
      75,    41,     3,    39,    43,    52,    77,    78,    75,    75,
      75,    75,    75,    76,    45,    41,    44,    46,     8,    68,
      70,    41,    41,    73,    75,    41,    75,    41,    41,    44,
      52,    53,    75,    75,    75,    46,     8,    75,    45,    41,
      44,    39,    58,    60,    62,    45,    46,    42,     8,    55,
      53,    41,    46,     3,    45,    73,    23,    64,    53,    27,
      69,    46,    39,    65,    70,    67,    56,    53,     3,    39,
      51,    73,    43,    41,    57,    53
};

#define yyerrok		(yyerrstatus = 0)
#define yyclearin	(yychar = YYEMPTY)
#define YYEMPTY		(-2)
#define YYEOF		0

#define YYACCEPT	goto yyacceptlab
#define YYABORT		goto yyabortlab
#define YYERROR		goto yyerrorlab


/* Like YYERROR except do call yyerror.  This remains here temporarily
   to ease the transition to the new meaning of YYERROR, for GCC.
   Once GCC version 2 has supplanted version 1, this can go.  */

#define YYFAIL		goto yyerrlab

#define YYRECOVERING()  (!!yyerrstatus)

#define YYBACKUP(Token, Value)					\
do								\
  if (yychar == YYEMPTY && yylen == 1)				\
    {								\
      yychar = (Token);						\
      yylval = (Value);						\
      yytoken = YYTRANSLATE (yychar);				\
      YYPOPSTACK (1);						\
      goto yybackup;						\
    }								\
  else								\
    {								\
      yyerror (YY_("syntax error: cannot back up")); \
      YYERROR;							\
    }								\
while (YYID (0))


#define YYTERROR	1
#define YYERRCODE	256


/* YYLLOC_DEFAULT -- Set CURRENT to span from RHS[1] to RHS[N].
   If N is 0, then set CURRENT to the empty location which ends
   the previous symbol: RHS[0] (always defined).  */

#define YYRHSLOC(Rhs, K) ((Rhs)[K])
#ifndef YYLLOC_DEFAULT
# define YYLLOC_DEFAULT(Current, Rhs, N)				\
    do									\
      if (YYID (N))                                                    \
	{								\
	  (Current).first_line   = YYRHSLOC (Rhs, 1).first_line;	\
	  (Current).first_column = YYRHSLOC (Rhs, 1).first_column;	\
	  (Current).last_line    = YYRHSLOC (Rhs, N).last_line;		\
	  (Current).last_column  = YYRHSLOC (Rhs, N).last_column;	\
	}								\
      else								\
	{								\
	  (Current).first_line   = (Current).last_line   =		\
	    YYRHSLOC (Rhs, 0).last_line;				\
	  (Current).first_column = (Current).last_column =		\
	    YYRHSLOC (Rhs, 0).last_column;				\
	}								\
    while (YYID (0))
#endif


/* YY_LOCATION_PRINT -- Print the location on the stream.
   This macro was not mandated originally: define only if we know
   we won't break user code: when these are the locations we know.  */

#ifndef YY_LOCATION_PRINT
# if YYLTYPE_IS_TRIVIAL
#  define YY_LOCATION_PRINT(File, Loc)			\
     fprintf (File, "%d.%d-%d.%d",			\
	      (Loc).first_line, (Loc).first_column,	\
	      (Loc).last_line,  (Loc).last_column)
# else
#  define YY_LOCATION_PRINT(File, Loc) ((void) 0)
# endif
#endif


/* YYLEX -- calling `yylex' with the right arguments.  */

#ifdef YYLEX_PARAM
# define YYLEX yylex (YYLEX_PARAM)
#else
# define YYLEX yylex ()
#endif

/* Enable debugging if requested.  */
#if YYDEBUG

# ifndef YYFPRINTF
#  include <stdio.h> /* INFRINGES ON USER NAME SPACE */
#  define YYFPRINTF fprintf
# endif

# define YYDPRINTF(Args)			\
do {						\
  if (yydebug)					\
    YYFPRINTF Args;				\
} while (YYID (0))

# define YY_SYMBOL_PRINT(Title, Type, Value, Location)			  \
do {									  \
  if (yydebug)								  \
    {									  \
      YYFPRINTF (stderr, "%s ", Title);					  \
      yy_symbol_print (stderr,						  \
		  Type, Value); \
      YYFPRINTF (stderr, "\n");						  \
    }									  \
} while (YYID (0))


/*--------------------------------.
| Print this symbol on YYOUTPUT.  |
`--------------------------------*/

/*ARGSUSED*/
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
yy_symbol_value_print (FILE *yyoutput, int yytype, YYSTYPE const * const yyvaluep)
#else
static void
yy_symbol_value_print (yyoutput, yytype, yyvaluep)
    FILE *yyoutput;
    int yytype;
    YYSTYPE const * const yyvaluep;
#endif
{
  if (!yyvaluep)
    return;
# ifdef YYPRINT
  if (yytype < YYNTOKENS)
    YYPRINT (yyoutput, yytoknum[yytype], *yyvaluep);
# else
  YYUSE (yyoutput);
# endif
  switch (yytype)
    {
      default:
	break;
    }
}


/*--------------------------------.
| Print this symbol on YYOUTPUT.  |
`--------------------------------*/

#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
yy_symbol_print (FILE *yyoutput, int yytype, YYSTYPE const * const yyvaluep)
#else
static void
yy_symbol_print (yyoutput, yytype, yyvaluep)
    FILE *yyoutput;
    int yytype;
    YYSTYPE const * const yyvaluep;
#endif
{
  if (yytype < YYNTOKENS)
    YYFPRINTF (yyoutput, "token %s (", yytname[yytype]);
  else
    YYFPRINTF (yyoutput, "nterm %s (", yytname[yytype]);

  yy_symbol_value_print (yyoutput, yytype, yyvaluep);
  YYFPRINTF (yyoutput, ")");
}

/*------------------------------------------------------------------.
| yy_stack_print -- Print the state stack from its BOTTOM up to its |
| TOP (included).                                                   |
`------------------------------------------------------------------*/

#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
yy_stack_print (yytype_int16 *yybottom, yytype_int16 *yytop)
#else
static void
yy_stack_print (yybottom, yytop)
    yytype_int16 *yybottom;
    yytype_int16 *yytop;
#endif
{
  YYFPRINTF (stderr, "Stack now");
  for (; yybottom <= yytop; yybottom++)
    {
      int yybot = *yybottom;
      YYFPRINTF (stderr, " %d", yybot);
    }
  YYFPRINTF (stderr, "\n");
}

# define YY_STACK_PRINT(Bottom, Top)				\
do {								\
  if (yydebug)							\
    yy_stack_print ((Bottom), (Top));				\
} while (YYID (0))


/*------------------------------------------------.
| Report that the YYRULE is going to be reduced.  |
`------------------------------------------------*/

#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
yy_reduce_print (YYSTYPE *yyvsp, int yyrule)
#else
static void
yy_reduce_print (yyvsp, yyrule)
    YYSTYPE *yyvsp;
    int yyrule;
#endif
{
  int yynrhs = yyr2[yyrule];
  int yyi;
  unsigned long int yylno = yyrline[yyrule];
  YYFPRINTF (stderr, "Reducing stack by rule %d (line %lu):\n",
	     yyrule - 1, yylno);
  /* The symbols being reduced.  */
  for (yyi = 0; yyi < yynrhs; yyi++)
    {
      YYFPRINTF (stderr, "   $%d = ", yyi + 1);
      yy_symbol_print (stderr, yyrhs[yyprhs[yyrule] + yyi],
		       &(yyvsp[(yyi + 1) - (yynrhs)])
		       		       );
      YYFPRINTF (stderr, "\n");
    }
}

# define YY_REDUCE_PRINT(Rule)		\
do {					\
  if (yydebug)				\
    yy_reduce_print (yyvsp, Rule); \
} while (YYID (0))

/* Nonzero means print parse trace.  It is left uninitialized so that
   multiple parsers can coexist.  */
int yydebug;
#else /* !YYDEBUG */
# define YYDPRINTF(Args)
# define YY_SYMBOL_PRINT(Title, Type, Value, Location)
# define YY_STACK_PRINT(Bottom, Top)
# define YY_REDUCE_PRINT(Rule)
#endif /* !YYDEBUG */


/* YYINITDEPTH -- initial size of the parser's stacks.  */
#ifndef	YYINITDEPTH
# define YYINITDEPTH 200
#endif

/* YYMAXDEPTH -- maximum size the stacks can grow to (effective only
   if the built-in stack extension method is used).

   Do not make this value too large; the results are undefined if
   YYSTACK_ALLOC_MAXIMUM < YYSTACK_BYTES (YYMAXDEPTH)
   evaluated with infinite-precision integer arithmetic.  */

#ifndef YYMAXDEPTH
# define YYMAXDEPTH 10000
#endif



#if YYERROR_VERBOSE

# ifndef yystrlen
#  if defined __GLIBC__ && defined _STRING_H
#   define yystrlen strlen
#  else
/* Return the length of YYSTR.  */
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static YYSIZE_T
yystrlen (const char *yystr)
#else
static YYSIZE_T
yystrlen (yystr)
    const char *yystr;
#endif
{
  YYSIZE_T yylen;
  for (yylen = 0; yystr[yylen]; yylen++)
    continue;
  return yylen;
}
#  endif
# endif

# ifndef yystpcpy
#  if defined __GLIBC__ && defined _STRING_H && defined _GNU_SOURCE
#   define yystpcpy stpcpy
#  else
/* Copy YYSRC to YYDEST, returning the address of the terminating '\0' in
   YYDEST.  */
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static char *
yystpcpy (char *yydest, const char *yysrc)
#else
static char *
yystpcpy (yydest, yysrc)
    char *yydest;
    const char *yysrc;
#endif
{
  char *yyd = yydest;
  const char *yys = yysrc;

  while ((*yyd++ = *yys++) != '\0')
    continue;

  return yyd - 1;
}
#  endif
# endif

# ifndef yytnamerr
/* Copy to YYRES the contents of YYSTR after stripping away unnecessary
   quotes and backslashes, so that it's suitable for yyerror.  The
   heuristic is that double-quoting is unnecessary unless the string
   contains an apostrophe, a comma, or backslash (other than
   backslash-backslash).  YYSTR is taken from yytname.  If YYRES is
   null, do not copy; instead, return the length of what the result
   would have been.  */
static YYSIZE_T
yytnamerr (char *yyres, const char *yystr)
{
  if (*yystr == '"')
    {
      YYSIZE_T yyn = 0;
      char const *yyp = yystr;

      for (;;)
	switch (*++yyp)
	  {
	  case '\'':
	  case ',':
	    goto do_not_strip_quotes;

	  case '\\':
	    if (*++yyp != '\\')
	      goto do_not_strip_quotes;
	    /* Fall through.  */
	  default:
	    if (yyres)
	      yyres[yyn] = *yyp;
	    yyn++;
	    break;

	  case '"':
	    if (yyres)
	      yyres[yyn] = '\0';
	    return yyn;
	  }
    do_not_strip_quotes: ;
    }

  if (! yyres)
    return yystrlen (yystr);

  return yystpcpy (yyres, yystr) - yyres;
}
# endif

/* Copy into YYRESULT an error message about the unexpected token
   YYCHAR while in state YYSTATE.  Return the number of bytes copied,
   including the terminating null byte.  If YYRESULT is null, do not
   copy anything; just return the number of bytes that would be
   copied.  As a special case, return 0 if an ordinary "syntax error"
   message will do.  Return YYSIZE_MAXIMUM if overflow occurs during
   size calculation.  */
static YYSIZE_T
yysyntax_error (char *yyresult, int yystate, int yychar)
{
  int yyn = yypact[yystate];

  if (! (YYPACT_NINF < yyn && yyn <= YYLAST))
    return 0;
  else
    {
      int yytype = YYTRANSLATE (yychar);
      YYSIZE_T yysize0 = yytnamerr (0, yytname[yytype]);
      YYSIZE_T yysize = yysize0;
      YYSIZE_T yysize1;
      int yysize_overflow = 0;
      enum { YYERROR_VERBOSE_ARGS_MAXIMUM = 5 };
      char const *yyarg[YYERROR_VERBOSE_ARGS_MAXIMUM];
      int yyx;

# if 0
      /* This is so xgettext sees the translatable formats that are
	 constructed on the fly.  */
      YY_("syntax error, unexpected %s");
      YY_("syntax error, unexpected %s, expecting %s");
      YY_("syntax error, unexpected %s, expecting %s or %s");
      YY_("syntax error, unexpected %s, expecting %s or %s or %s");
      YY_("syntax error, unexpected %s, expecting %s or %s or %s or %s");
# endif
      char *yyfmt;
      char const *yyf;
      static char const yyunexpected[] = "syntax error, unexpected %s";
      static char const yyexpecting[] = ", expecting %s";
      static char const yyor[] = " or %s";
      char yyformat[sizeof yyunexpected
		    + sizeof yyexpecting - 1
		    + ((YYERROR_VERBOSE_ARGS_MAXIMUM - 2)
		       * (sizeof yyor - 1))];
      char const *yyprefix = yyexpecting;

      /* Start YYX at -YYN if negative to avoid negative indexes in
	 YYCHECK.  */
      int yyxbegin = yyn < 0 ? -yyn : 0;

      /* Stay within bounds of both yycheck and yytname.  */
      int yychecklim = YYLAST - yyn + 1;
      int yyxend = yychecklim < YYNTOKENS ? yychecklim : YYNTOKENS;
      int yycount = 1;

      yyarg[0] = yytname[yytype];
      yyfmt = yystpcpy (yyformat, yyunexpected);

      for (yyx = yyxbegin; yyx < yyxend; ++yyx)
	if (yycheck[yyx + yyn] == yyx && yyx != YYTERROR)
	  {
	    if (yycount == YYERROR_VERBOSE_ARGS_MAXIMUM)
	      {
		yycount = 1;
		yysize = yysize0;
		yyformat[sizeof yyunexpected - 1] = '\0';
		break;
	      }
	    yyarg[yycount++] = yytname[yyx];
	    yysize1 = yysize + yytnamerr (0, yytname[yyx]);
	    yysize_overflow |= (yysize1 < yysize);
	    yysize = yysize1;
	    yyfmt = yystpcpy (yyfmt, yyprefix);
	    yyprefix = yyor;
	  }

      yyf = YY_(yyformat);
      yysize1 = yysize + yystrlen (yyf);
      yysize_overflow |= (yysize1 < yysize);
      yysize = yysize1;

      if (yysize_overflow)
	return YYSIZE_MAXIMUM;

      if (yyresult)
	{
	  /* Avoid sprintf, as that infringes on the user's name space.
	     Don't have undefined behavior even if the translation
	     produced a string with the wrong number of "%s"s.  */
	  char *yyp = yyresult;
	  int yyi = 0;
	  while ((*yyp = *yyf) != '\0')
	    {
	      if (*yyp == '%' && yyf[1] == 's' && yyi < yycount)
		{
		  yyp += yytnamerr (yyp, yyarg[yyi++]);
		  yyf += 2;
		}
	      else
		{
		  yyp++;
		  yyf++;
		}
	    }
	}
      return yysize;
    }
}
#endif /* YYERROR_VERBOSE */


/*-----------------------------------------------.
| Release the memory associated to this symbol.  |
`-----------------------------------------------*/

/*ARGSUSED*/
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
yydestruct (const char *yymsg, int yytype, YYSTYPE *yyvaluep)
#else
static void
yydestruct (yymsg, yytype, yyvaluep)
    const char *yymsg;
    int yytype;
    YYSTYPE *yyvaluep;
#endif
{
  YYUSE (yyvaluep);

  if (!yymsg)
    yymsg = "Deleting";
  YY_SYMBOL_PRINT (yymsg, yytype, yyvaluep, yylocationp);

  switch (yytype)
    {

      default:
	break;
    }
}

/* Prevent warnings from -Wmissing-prototypes.  */
#ifdef YYPARSE_PARAM
#if defined __STDC__ || defined __cplusplus
int yyparse (void *YYPARSE_PARAM);
#else
int yyparse ();
#endif
#else /* ! YYPARSE_PARAM */
#if defined __STDC__ || defined __cplusplus
int yyparse (void);
#else
int yyparse ();
#endif
#endif /* ! YYPARSE_PARAM */


/* The lookahead symbol.  */
int yychar;

/* The semantic value of the lookahead symbol.  */
YYSTYPE yylval;

/* Number of syntax errors so far.  */
int yynerrs;



/*-------------------------.
| yyparse or yypush_parse.  |
`-------------------------*/

#ifdef YYPARSE_PARAM
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
int
yyparse (void *YYPARSE_PARAM)
#else
int
yyparse (YYPARSE_PARAM)
    void *YYPARSE_PARAM;
#endif
#else /* ! YYPARSE_PARAM */
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
int
yyparse (void)
#else
int
yyparse ()

#endif
#endif
{


    int yystate;
    /* Number of tokens to shift before error messages enabled.  */
    int yyerrstatus;

    /* The stacks and their tools:
       `yyss': related to states.
       `yyvs': related to semantic values.

       Refer to the stacks thru separate pointers, to allow yyoverflow
       to reallocate them elsewhere.  */

    /* The state stack.  */
    yytype_int16 yyssa[YYINITDEPTH];
    yytype_int16 *yyss;
    yytype_int16 *yyssp;

    /* The semantic value stack.  */
    YYSTYPE yyvsa[YYINITDEPTH];
    YYSTYPE *yyvs;
    YYSTYPE *yyvsp;

    YYSIZE_T yystacksize;

  int yyn;
  int yyresult;
  /* Lookahead token as an internal (translated) token number.  */
  int yytoken;
  /* The variables used to return semantic value and location from the
     action routines.  */
  YYSTYPE yyval;

#if YYERROR_VERBOSE
  /* Buffer for error messages, and its allocated size.  */
  char yymsgbuf[128];
  char *yymsg = yymsgbuf;
  YYSIZE_T yymsg_alloc = sizeof yymsgbuf;
#endif

#define YYPOPSTACK(N)   (yyvsp -= (N), yyssp -= (N))

  /* The number of symbols on the RHS of the reduced rule.
     Keep to zero when no symbol should be popped.  */
  int yylen = 0;

  yytoken = 0;
  yyss = yyssa;
  yyvs = yyvsa;
  yystacksize = YYINITDEPTH;

  YYDPRINTF ((stderr, "Starting parse\n"));

  yystate = 0;
  yyerrstatus = 0;
  yynerrs = 0;
  yychar = YYEMPTY; /* Cause a token to be read.  */

  /* Initialize stack pointers.
     Waste one element of value and location stack
     so that they stay on the same level as the state stack.
     The wasted elements are never initialized.  */
  yyssp = yyss;
  yyvsp = yyvs;

  goto yysetstate;

/*------------------------------------------------------------.
| yynewstate -- Push a new state, which is found in yystate.  |
`------------------------------------------------------------*/
 yynewstate:
  /* In all cases, when you get here, the value and location stacks
     have just been pushed.  So pushing a state here evens the stacks.  */
  yyssp++;

 yysetstate:
  *yyssp = yystate;

  if (yyss + yystacksize - 1 <= yyssp)
    {
      /* Get the current used size of the three stacks, in elements.  */
      YYSIZE_T yysize = yyssp - yyss + 1;

#ifdef yyoverflow
      {
	/* Give user a chance to reallocate the stack.  Use copies of
	   these so that the &'s don't force the real ones into
	   memory.  */
	YYSTYPE *yyvs1 = yyvs;
	yytype_int16 *yyss1 = yyss;

	/* Each stack pointer address is followed by the size of the
	   data in use in that stack, in bytes.  This used to be a
	   conditional around just the two extra args, but that might
	   be undefined if yyoverflow is a macro.  */
	yyoverflow (YY_("memory exhausted"),
		    &yyss1, yysize * sizeof (*yyssp),
		    &yyvs1, yysize * sizeof (*yyvsp),
		    &yystacksize);

	yyss = yyss1;
	yyvs = yyvs1;
      }
#else /* no yyoverflow */
# ifndef YYSTACK_RELOCATE
      goto yyexhaustedlab;
# else
      /* Extend the stack our own way.  */
      if (YYMAXDEPTH <= yystacksize)
	goto yyexhaustedlab;
      yystacksize *= 2;
      if (YYMAXDEPTH < yystacksize)
	yystacksize = YYMAXDEPTH;

      {
	yytype_int16 *yyss1 = yyss;
	union yyalloc *yyptr =
	  (union yyalloc *) YYSTACK_ALLOC (YYSTACK_BYTES (yystacksize));
	if (! yyptr)
	  goto yyexhaustedlab;
	YYSTACK_RELOCATE (yyss_alloc, yyss);
	YYSTACK_RELOCATE (yyvs_alloc, yyvs);
#  undef YYSTACK_RELOCATE
	if (yyss1 != yyssa)
	  YYSTACK_FREE (yyss1);
      }
# endif
#endif /* no yyoverflow */

      yyssp = yyss + yysize - 1;
      yyvsp = yyvs + yysize - 1;

      YYDPRINTF ((stderr, "Stack size increased to %lu\n",
		  (unsigned long int) yystacksize));

      if (yyss + yystacksize - 1 <= yyssp)
	YYABORT;
    }

  YYDPRINTF ((stderr, "Entering state %d\n", yystate));

  if (yystate == YYFINAL)
    YYACCEPT;

  goto yybackup;

/*-----------.
| yybackup.  |
`-----------*/
yybackup:

  /* Do appropriate processing given the current state.  Read a
     lookahead token if we need one and don't already have one.  */

  /* First try to decide what to do without reference to lookahead token.  */
  yyn = yypact[yystate];
  if (yyn == YYPACT_NINF)
    goto yydefault;

  /* Not known => get a lookahead token if don't already have one.  */

  /* YYCHAR is either YYEMPTY or YYEOF or a valid lookahead symbol.  */
  if (yychar == YYEMPTY)
    {
      YYDPRINTF ((stderr, "Reading a token: "));
      yychar = YYLEX;
    }

  if (yychar <= YYEOF)
    {
      yychar = yytoken = YYEOF;
      YYDPRINTF ((stderr, "Now at end of input.\n"));
    }
  else
    {
      yytoken = YYTRANSLATE (yychar);
      YY_SYMBOL_PRINT ("Next token is", yytoken, &yylval, &yylloc);
    }

  /* If the proper action on seeing token YYTOKEN is to reduce or to
     detect an error, take that action.  */
  yyn += yytoken;
  if (yyn < 0 || YYLAST < yyn || yycheck[yyn] != yytoken)
    goto yydefault;
  yyn = yytable[yyn];
  if (yyn <= 0)
    {
      if (yyn == 0 || yyn == YYTABLE_NINF)
	goto yyerrlab;
      yyn = -yyn;
      goto yyreduce;
    }

  /* Count tokens shifted since error; after three, turn off error
     status.  */
  if (yyerrstatus)
    yyerrstatus--;

  /* Shift the lookahead token.  */
  YY_SYMBOL_PRINT ("Shifting", yytoken, &yylval, &yylloc);

  /* Discard the shifted token.  */
  yychar = YYEMPTY;

  yystate = yyn;
  *++yyvsp = yylval;

  goto yynewstate;


/*-----------------------------------------------------------.
| yydefault -- do the default action for the current state.  |
`-----------------------------------------------------------*/
yydefault:
  yyn = yydefact[yystate];
  if (yyn == 0)
    goto yyerrlab;
  goto yyreduce;


/*-----------------------------.
| yyreduce -- Do a reduction.  |
`-----------------------------*/
yyreduce:
  /* yyn is the number of a rule to reduce with.  */
  yylen = yyr2[yyn];

  /* If YYLEN is nonzero, implement the default value of the action:
     `$$ = $1'.

     Otherwise, the following line sets YYVAL to garbage.
     This behavior is undocumented and Bison
     users should not rely upon it.  Assigning to YYVAL
     unconditionally makes the parser a bit smaller, and it avoids a
     GCC warning that YYVAL may be used uninitialized.  */
  yyval = yyvsp[1-yylen];


  YY_REDUCE_PRINT (yyn);
  switch (yyn)
    {
        case 2:

/* Line 1455 of yacc.c  */
#line 106 "bc.y"
    {
			      (yyval.i_value) = 0;
			      if (interactive)
				{
				  printf ("%s\n", BC_VERSION);
				  welcome ();
				}
			    }
    break;

  case 4:

/* Line 1455 of yacc.c  */
#line 117 "bc.y"
    { run_code (); }
    break;

  case 5:

/* Line 1455 of yacc.c  */
#line 119 "bc.y"
    { run_code (); }
    break;

  case 6:

/* Line 1455 of yacc.c  */
#line 121 "bc.y"
    {
			      yyerrok;
			      init_gen ();
			    }
    break;

  case 7:

/* Line 1455 of yacc.c  */
#line 127 "bc.y"
    { (yyval.i_value) = 0; }
    break;

  case 11:

/* Line 1455 of yacc.c  */
#line 133 "bc.y"
    { (yyval.i_value) = 0; }
    break;

  case 18:

/* Line 1455 of yacc.c  */
#line 142 "bc.y"
    { (yyval.i_value) = (yyvsp[(2) - (2)].i_value); }
    break;

  case 19:

/* Line 1455 of yacc.c  */
#line 145 "bc.y"
    { warranty (""); }
    break;

  case 20:

/* Line 1455 of yacc.c  */
#line 147 "bc.y"
    { limits (); }
    break;

  case 21:

/* Line 1455 of yacc.c  */
#line 149 "bc.y"
    {
			      if ((yyvsp[(1) - (1)].i_value) & 2)
				warns ("comparison in expression");
			      if ((yyvsp[(1) - (1)].i_value) & 1)
				generate ("W");
			      else 
				generate ("p");
			    }
    break;

  case 22:

/* Line 1455 of yacc.c  */
#line 158 "bc.y"
    {
			      (yyval.i_value) = 0;
			      generate ("w");
			      generate ((yyvsp[(1) - (1)].s_value));
			      free ((yyvsp[(1) - (1)].s_value));
			    }
    break;

  case 23:

/* Line 1455 of yacc.c  */
#line 165 "bc.y"
    {
			      if (break_label == 0)
				yyerror ("Break outside a for/while");
			      else
				{
				  sprintf (genstr, "J%1d:", break_label);
				  generate (genstr);
				}
			    }
    break;

  case 24:

/* Line 1455 of yacc.c  */
#line 175 "bc.y"
    {
			      warns ("Continue statement");
			      if (continue_label == 0)
				yyerror ("Continue outside a for");
			      else
				{
				  sprintf (genstr, "J%1d:", continue_label);
				  generate (genstr);
				}
			    }
    break;

  case 25:

/* Line 1455 of yacc.c  */
#line 186 "bc.y"
    { exit (0); }
    break;

  case 26:

/* Line 1455 of yacc.c  */
#line 188 "bc.y"
    { generate ("h"); }
    break;

  case 27:

/* Line 1455 of yacc.c  */
#line 190 "bc.y"
    { generate ("0R"); }
    break;

  case 28:

/* Line 1455 of yacc.c  */
#line 192 "bc.y"
    { generate ("R"); }
    break;

  case 29:

/* Line 1455 of yacc.c  */
#line 194 "bc.y"
    {
			      (yyvsp[(1) - (1)].i_value) = break_label; 
			      break_label = next_label++;
			    }
    break;

  case 30:

/* Line 1455 of yacc.c  */
#line 199 "bc.y"
    {
			      if ((yyvsp[(4) - (5)].i_value) > 1)
				warns ("Comparison in first for expression");
			      (yyvsp[(4) - (5)].i_value) = next_label++;
			      if ((yyvsp[(4) - (5)].i_value) < 0)
				sprintf (genstr, "N%1d:", (yyvsp[(4) - (5)].i_value));
			      else
				sprintf (genstr, "pN%1d:", (yyvsp[(4) - (5)].i_value));
			      generate (genstr);
			    }
    break;

  case 31:

/* Line 1455 of yacc.c  */
#line 210 "bc.y"
    {
			      if ((yyvsp[(7) - (8)].i_value) < 0) generate ("1");
			      (yyvsp[(7) - (8)].i_value) = next_label++;
			      sprintf (genstr, "B%1d:J%1d:", (yyvsp[(7) - (8)].i_value), break_label);
			      generate (genstr);
			      (yyval.i_value) = continue_label;
			      continue_label = next_label++;
			      sprintf (genstr, "N%1d:", continue_label);
			      generate (genstr);
			    }
    break;

  case 32:

/* Line 1455 of yacc.c  */
#line 221 "bc.y"
    {
			      if ((yyvsp[(10) - (11)].i_value) > 1)
				warns ("Comparison in third for expression");
			      if ((yyvsp[(10) - (11)].i_value) < 0)
				sprintf (genstr, "J%1d:N%1d:", (yyvsp[(4) - (11)].i_value), (yyvsp[(7) - (11)].i_value));
			      else
				sprintf (genstr, "pJ%1d:N%1d:", (yyvsp[(4) - (11)].i_value), (yyvsp[(7) - (11)].i_value));
			      generate (genstr);
			    }
    break;

  case 33:

/* Line 1455 of yacc.c  */
#line 231 "bc.y"
    {
			      sprintf (genstr, "J%1d:N%1d:",
				       continue_label, break_label);
			      generate (genstr);
			      break_label = (yyvsp[(1) - (13)].i_value);
			      continue_label = (yyvsp[(9) - (13)].i_value);
			    }
    break;

  case 34:

/* Line 1455 of yacc.c  */
#line 239 "bc.y"
    {
			      (yyvsp[(3) - (4)].i_value) = if_label;
			      if_label = next_label++;
			      sprintf (genstr, "Z%1d:", if_label);
			      generate (genstr);
			    }
    break;

  case 35:

/* Line 1455 of yacc.c  */
#line 246 "bc.y"
    {
			      sprintf (genstr, "N%1d:", if_label); 
			      generate (genstr);
			      if_label = (yyvsp[(3) - (7)].i_value);
			    }
    break;

  case 36:

/* Line 1455 of yacc.c  */
#line 252 "bc.y"
    {
			      (yyvsp[(1) - (1)].i_value) = next_label++;
			      sprintf (genstr, "N%1d:", (yyvsp[(1) - (1)].i_value));
			      generate (genstr);
			    }
    break;

  case 37:

/* Line 1455 of yacc.c  */
#line 258 "bc.y"
    {
			      (yyvsp[(4) - (4)].i_value) = break_label; 
			      break_label = next_label++;
			      sprintf (genstr, "Z%1d:", break_label);
			      generate (genstr);
			    }
    break;

  case 38:

/* Line 1455 of yacc.c  */
#line 265 "bc.y"
    {
			      sprintf (genstr, "J%1d:N%1d:", (yyvsp[(1) - (7)].i_value), break_label);
			      generate (genstr);
			      break_label = (yyvsp[(4) - (7)].i_value);
			    }
    break;

  case 39:

/* Line 1455 of yacc.c  */
#line 271 "bc.y"
    { (yyval.i_value) = 0; }
    break;

  case 40:

/* Line 1455 of yacc.c  */
#line 273 "bc.y"
    {  warns ("print statement"); }
    break;

  case 44:

/* Line 1455 of yacc.c  */
#line 280 "bc.y"
    {
			      generate ("O");
			      generate ((yyvsp[(1) - (1)].s_value));
			      free ((yyvsp[(1) - (1)].s_value));
			    }
    break;

  case 45:

/* Line 1455 of yacc.c  */
#line 286 "bc.y"
    { generate ("P"); }
    break;

  case 47:

/* Line 1455 of yacc.c  */
#line 290 "bc.y"
    {
			      warns ("else clause in if statement");
			      (yyvsp[(1) - (1)].i_value) = next_label++;
			      sprintf (genstr, "J%d:N%1d:", (yyvsp[(1) - (1)].i_value), if_label); 
			      generate (genstr);
			      if_label = (yyvsp[(1) - (1)].i_value);
			    }
    break;

  case 49:

/* Line 1455 of yacc.c  */
#line 300 "bc.y"
    {
			      /* Check auto list against parameter list? */
			      check_params ((yyvsp[(4) - (8)].a_value),(yyvsp[(8) - (8)].a_value));
			      sprintf (genstr, "F%d,%s.%s[",
				       lookup((yyvsp[(2) - (8)].s_value),FUNCTDEF), 
				       arg_str ((yyvsp[(4) - (8)].a_value)), arg_str ((yyvsp[(8) - (8)].a_value)));
			      generate (genstr);
			      free_args ((yyvsp[(4) - (8)].a_value));
			      free_args ((yyvsp[(8) - (8)].a_value));
			      (yyvsp[(1) - (8)].i_value) = next_label;
			      next_label = 1;
			    }
    break;

  case 50:

/* Line 1455 of yacc.c  */
#line 313 "bc.y"
    {
			      generate ("0R]");
			      next_label = (yyvsp[(1) - (11)].i_value);
			    }
    break;

  case 51:

/* Line 1455 of yacc.c  */
#line 319 "bc.y"
    { (yyval.a_value) = NULL; }
    break;

  case 53:

/* Line 1455 of yacc.c  */
#line 323 "bc.y"
    { (yyval.a_value) = NULL; }
    break;

  case 54:

/* Line 1455 of yacc.c  */
#line 325 "bc.y"
    { (yyval.a_value) = (yyvsp[(2) - (3)].a_value); }
    break;

  case 55:

/* Line 1455 of yacc.c  */
#line 327 "bc.y"
    { (yyval.a_value) = (yyvsp[(2) - (3)].a_value); }
    break;

  case 56:

/* Line 1455 of yacc.c  */
#line 330 "bc.y"
    { (yyval.a_value) = nextarg (NULL, lookup ((yyvsp[(1) - (1)].s_value),SIMPLE)); }
    break;

  case 57:

/* Line 1455 of yacc.c  */
#line 332 "bc.y"
    { (yyval.a_value) = nextarg (NULL, lookup ((yyvsp[(1) - (3)].s_value),ARRAY)); }
    break;

  case 58:

/* Line 1455 of yacc.c  */
#line 334 "bc.y"
    { (yyval.a_value) = nextarg ((yyvsp[(1) - (3)].a_value), lookup ((yyvsp[(3) - (3)].s_value),SIMPLE)); }
    break;

  case 59:

/* Line 1455 of yacc.c  */
#line 336 "bc.y"
    { (yyval.a_value) = nextarg ((yyvsp[(1) - (5)].a_value), lookup ((yyvsp[(3) - (5)].s_value),ARRAY)); }
    break;

  case 60:

/* Line 1455 of yacc.c  */
#line 339 "bc.y"
    { (yyval.a_value) = NULL; }
    break;

  case 62:

/* Line 1455 of yacc.c  */
#line 343 "bc.y"
    {
			      if ((yyvsp[(1) - (1)].i_value) > 1) warns ("comparison in argument");
			      (yyval.a_value) = nextarg (NULL,0);
			    }
    break;

  case 63:

/* Line 1455 of yacc.c  */
#line 348 "bc.y"
    {
			      sprintf (genstr, "K%d:", -lookup ((yyvsp[(1) - (3)].s_value),ARRAY));
			      generate (genstr);
			      (yyval.a_value) = nextarg (NULL,1);
			    }
    break;

  case 64:

/* Line 1455 of yacc.c  */
#line 354 "bc.y"
    {
			      if ((yyvsp[(3) - (3)].i_value) > 1) warns ("comparison in argument");
			      (yyval.a_value) = nextarg ((yyvsp[(1) - (3)].a_value),0);
			    }
    break;

  case 65:

/* Line 1455 of yacc.c  */
#line 359 "bc.y"
    {
			      sprintf (genstr, "K%d:", -lookup ((yyvsp[(3) - (5)].s_value),ARRAY));
			      generate (genstr);
			      (yyval.a_value) = nextarg ((yyvsp[(1) - (5)].a_value),1);
			    }
    break;

  case 66:

/* Line 1455 of yacc.c  */
#line 366 "bc.y"
    {
			      (yyval.i_value) = -1;
			      warns ("Missing expression in for statement");
			    }
    break;

  case 68:

/* Line 1455 of yacc.c  */
#line 373 "bc.y"
    {
			      (yyval.i_value) = 0;
			      generate ("0");
			    }
    break;

  case 69:

/* Line 1455 of yacc.c  */
#line 378 "bc.y"
    {
			      if ((yyvsp[(1) - (1)].i_value) > 1)
				warns ("comparison in return expresion");
			    }
    break;

  case 70:

/* Line 1455 of yacc.c  */
#line 384 "bc.y"
    {
			      if ((yyvsp[(2) - (2)].c_value) != '=')
				{
				  if ((yyvsp[(1) - (2)].i_value) < 0)
				    sprintf (genstr, "DL%d:", -(yyvsp[(1) - (2)].i_value));
				  else
				    sprintf (genstr, "l%d:", (yyvsp[(1) - (2)].i_value));
				  generate (genstr);
				}
			    }
    break;

  case 71:

/* Line 1455 of yacc.c  */
#line 395 "bc.y"
    {
			      if ((yyvsp[(4) - (4)].i_value) > 1) warns("comparison in assignment");
			      if ((yyvsp[(2) - (4)].c_value) != '=')
				{
				  sprintf (genstr, "%c", (yyvsp[(2) - (4)].c_value));
				  generate (genstr);
				}
			      if ((yyvsp[(1) - (4)].i_value) < 0)
				sprintf (genstr, "S%d:", -(yyvsp[(1) - (4)].i_value));
			      else
				sprintf (genstr, "s%d:", (yyvsp[(1) - (4)].i_value));
			      generate (genstr);
			      (yyval.i_value) = 0;
			    }
    break;

  case 72:

/* Line 1455 of yacc.c  */
#line 411 "bc.y"
    {
			      warns("&& operator");
			      (yyvsp[(2) - (2)].i_value) = next_label++;
			      sprintf (genstr, "DZ%d:p", (yyvsp[(2) - (2)].i_value));
			      generate (genstr);
			    }
    break;

  case 73:

/* Line 1455 of yacc.c  */
#line 418 "bc.y"
    {
			      sprintf (genstr, "DZ%d:p1N%d:", (yyvsp[(2) - (4)].i_value), (yyvsp[(2) - (4)].i_value));
			      generate (genstr);
			      (yyval.i_value) = (yyvsp[(1) - (4)].i_value) | (yyvsp[(4) - (4)].i_value);
			    }
    break;

  case 74:

/* Line 1455 of yacc.c  */
#line 424 "bc.y"
    {
			      warns("|| operator");
			      (yyvsp[(2) - (2)].i_value) = next_label++;
			      sprintf (genstr, "B%d:", (yyvsp[(2) - (2)].i_value));
			      generate (genstr);
			    }
    break;

  case 75:

/* Line 1455 of yacc.c  */
#line 431 "bc.y"
    {
			      int tmplab;
			      tmplab = next_label++;
			      sprintf (genstr, "B%d:0J%d:N%d:1N%d:",
				       (yyvsp[(2) - (4)].i_value), tmplab, (yyvsp[(2) - (4)].i_value), tmplab);
			      generate (genstr);
			      (yyval.i_value) = (yyvsp[(1) - (4)].i_value) | (yyvsp[(4) - (4)].i_value);
			    }
    break;

  case 76:

/* Line 1455 of yacc.c  */
#line 440 "bc.y"
    {
			      (yyval.i_value) = (yyvsp[(2) - (2)].i_value);
			      warns("! operator");
			      generate ("!");
			    }
    break;

  case 77:

/* Line 1455 of yacc.c  */
#line 446 "bc.y"
    {
			      (yyval.i_value) = 3;
			      switch (*((yyvsp[(2) - (3)].s_value)))
				{
				case '=':
				  generate ("=");
				  break;

				case '!':
				  generate ("#");
				  break;

				case '<':
				  if ((yyvsp[(2) - (3)].s_value)[1] == '=')
				    generate ("{");
				  else
				    generate ("<");
				  break;

				case '>':
				  if ((yyvsp[(2) - (3)].s_value)[1] == '=')
				    generate ("}");
				  else
				    generate (">");
				  break;
				}
			    }
    break;

  case 78:

/* Line 1455 of yacc.c  */
#line 474 "bc.y"
    {
			      generate ("+");
			      (yyval.i_value) = (yyvsp[(1) - (3)].i_value) | (yyvsp[(3) - (3)].i_value);
			    }
    break;

  case 79:

/* Line 1455 of yacc.c  */
#line 479 "bc.y"
    {
			      generate ("-");
			      (yyval.i_value) = (yyvsp[(1) - (3)].i_value) | (yyvsp[(3) - (3)].i_value);
			    }
    break;

  case 80:

/* Line 1455 of yacc.c  */
#line 484 "bc.y"
    {
			      genstr[0] = (yyvsp[(2) - (3)].c_value);
			      genstr[1] = 0;
			      generate (genstr);
			      (yyval.i_value) = (yyvsp[(1) - (3)].i_value) | (yyvsp[(3) - (3)].i_value);
			    }
    break;

  case 81:

/* Line 1455 of yacc.c  */
#line 491 "bc.y"
    {
			      generate ("^");
			      (yyval.i_value) = (yyvsp[(1) - (3)].i_value) | (yyvsp[(3) - (3)].i_value);
			    }
    break;

  case 82:

/* Line 1455 of yacc.c  */
#line 496 "bc.y"
    {
			      generate ("n");
			      (yyval.i_value) = (yyvsp[(2) - (2)].i_value);
			    }
    break;

  case 83:

/* Line 1455 of yacc.c  */
#line 501 "bc.y"
    {
			      (yyval.i_value) = 1;
			      if ((yyvsp[(1) - (1)].i_value) < 0)
				sprintf (genstr, "L%d:", -(yyvsp[(1) - (1)].i_value));
			      else
				sprintf (genstr, "l%d:", (yyvsp[(1) - (1)].i_value));
			      generate (genstr);
			    }
    break;

  case 84:

/* Line 1455 of yacc.c  */
#line 510 "bc.y"
    {
			      int len = strlen((yyvsp[(1) - (1)].s_value));
			      (yyval.i_value) = 1;
			      if (len == 1 && *(yyvsp[(1) - (1)].s_value) == '0')
				generate ("0");
			      else if (len == 1 && *(yyvsp[(1) - (1)].s_value) == '1')
				generate ("1");
			      else
				{
				  generate ("K");
				  generate ((yyvsp[(1) - (1)].s_value));
				  generate (":");
				}
			      free ((yyvsp[(1) - (1)].s_value));
			    }
    break;

  case 85:

/* Line 1455 of yacc.c  */
#line 526 "bc.y"
    { (yyval.i_value) = (yyvsp[(2) - (3)].i_value) | 1; }
    break;

  case 86:

/* Line 1455 of yacc.c  */
#line 528 "bc.y"
    {
			      (yyval.i_value) = 1;
			      if ((yyvsp[(3) - (4)].a_value) != NULL)
				{ 
				  sprintf (genstr, "C%d,%s:",
					   lookup ((yyvsp[(1) - (4)].s_value),FUNCT),
					   call_str ((yyvsp[(3) - (4)].a_value)));
				  free_args ((yyvsp[(3) - (4)].a_value));
				}
			      else
				{
				  sprintf (genstr, "C%d:", lookup ((yyvsp[(1) - (4)].s_value),FUNCT));
				}
			      generate (genstr);
			    }
    break;

  case 87:

/* Line 1455 of yacc.c  */
#line 544 "bc.y"
    {
			      (yyval.i_value) = 1;
			      if ((yyvsp[(2) - (2)].i_value) < 0)
				{
				  if ((yyvsp[(1) - (2)].c_value) == '+')
				    sprintf (genstr, "DA%d:L%d:", -(yyvsp[(2) - (2)].i_value), -(yyvsp[(2) - (2)].i_value));
				  else
				    sprintf (genstr, "DM%d:L%d:", -(yyvsp[(2) - (2)].i_value), -(yyvsp[(2) - (2)].i_value));
				}
			      else
				{
				  if ((yyvsp[(1) - (2)].c_value) == '+')
				    sprintf (genstr, "i%d:l%d:", (yyvsp[(2) - (2)].i_value), (yyvsp[(2) - (2)].i_value));
				  else
				    sprintf (genstr, "d%d:l%d:", (yyvsp[(2) - (2)].i_value), (yyvsp[(2) - (2)].i_value));
				}
			      generate (genstr);
			    }
    break;

  case 88:

/* Line 1455 of yacc.c  */
#line 563 "bc.y"
    {
			      (yyval.i_value) = 1;
			      if ((yyvsp[(1) - (2)].i_value) < 0)
				{
				  sprintf (genstr, "DL%d:x", -(yyvsp[(1) - (2)].i_value));
				  generate (genstr); 
				  if ((yyvsp[(2) - (2)].c_value) == '+')
				    sprintf (genstr, "A%d:", -(yyvsp[(1) - (2)].i_value));
				  else
				      sprintf (genstr, "M%d:", -(yyvsp[(1) - (2)].i_value));
				}
			      else
				{
				  sprintf (genstr, "l%d:", (yyvsp[(1) - (2)].i_value));
				  generate (genstr);
				  if ((yyvsp[(2) - (2)].c_value) == '+')
				    sprintf (genstr, "i%d:", (yyvsp[(1) - (2)].i_value));
				  else
				    sprintf (genstr, "d%d:", (yyvsp[(1) - (2)].i_value));
				}
			      generate (genstr);
			    }
    break;

  case 89:

/* Line 1455 of yacc.c  */
#line 586 "bc.y"
    { generate ("cL"); (yyval.i_value) = 1;}
    break;

  case 90:

/* Line 1455 of yacc.c  */
#line 588 "bc.y"
    { generate ("cR"); (yyval.i_value) = 1;}
    break;

  case 91:

/* Line 1455 of yacc.c  */
#line 590 "bc.y"
    { generate ("cS"); (yyval.i_value) = 1;}
    break;

  case 92:

/* Line 1455 of yacc.c  */
#line 592 "bc.y"
    {
			      warns ("read function");
			      generate ("cI"); (yyval.i_value) = 1;
			    }
    break;

  case 93:

/* Line 1455 of yacc.c  */
#line 598 "bc.y"
    { (yyval.i_value) = lookup((yyvsp[(1) - (1)].s_value),SIMPLE); }
    break;

  case 94:

/* Line 1455 of yacc.c  */
#line 600 "bc.y"
    {
			      if ((yyvsp[(3) - (4)].i_value) > 1) warns("comparison in subscript");
			      (yyval.i_value) = lookup((yyvsp[(1) - (4)].s_value),ARRAY);
			    }
    break;

  case 95:

/* Line 1455 of yacc.c  */
#line 605 "bc.y"
    { (yyval.i_value) = 0; }
    break;

  case 96:

/* Line 1455 of yacc.c  */
#line 607 "bc.y"
    { (yyval.i_value) = 1; }
    break;

  case 97:

/* Line 1455 of yacc.c  */
#line 609 "bc.y"
    { (yyval.i_value) = 2; }
    break;

  case 98:

/* Line 1455 of yacc.c  */
#line 611 "bc.y"
    { (yyval.i_value) = 3;
			      warns ("Last variable");
			    }
    break;



/* Line 1455 of yacc.c  */
#line 2540 "y.tab.c"
      default: break;
    }
  YY_SYMBOL_PRINT ("-> $$ =", yyr1[yyn], &yyval, &yyloc);

  YYPOPSTACK (yylen);
  yylen = 0;
  YY_STACK_PRINT (yyss, yyssp);

  *++yyvsp = yyval;

  /* Now `shift' the result of the reduction.  Determine what state
     that goes to, based on the state we popped back to and the rule
     number reduced by.  */

  yyn = yyr1[yyn];

  yystate = yypgoto[yyn - YYNTOKENS] + *yyssp;
  if (0 <= yystate && yystate <= YYLAST && yycheck[yystate] == *yyssp)
    yystate = yytable[yystate];
  else
    yystate = yydefgoto[yyn - YYNTOKENS];

  goto yynewstate;


/*------------------------------------.
| yyerrlab -- here on detecting error |
`------------------------------------*/
yyerrlab:
  /* If not already recovering from an error, report this error.  */
  if (!yyerrstatus)
    {
      ++yynerrs;
#if ! YYERROR_VERBOSE
      yyerror (YY_("syntax error"));
#else
      {
	YYSIZE_T yysize = yysyntax_error (0, yystate, yychar);
	if (yymsg_alloc < yysize && yymsg_alloc < YYSTACK_ALLOC_MAXIMUM)
	  {
	    YYSIZE_T yyalloc = 2 * yysize;
	    if (! (yysize <= yyalloc && yyalloc <= YYSTACK_ALLOC_MAXIMUM))
	      yyalloc = YYSTACK_ALLOC_MAXIMUM;
	    if (yymsg != yymsgbuf)
	      YYSTACK_FREE (yymsg);
	    yymsg = (char *) YYSTACK_ALLOC (yyalloc);
	    if (yymsg)
	      yymsg_alloc = yyalloc;
	    else
	      {
		yymsg = yymsgbuf;
		yymsg_alloc = sizeof yymsgbuf;
	      }
	  }

	if (0 < yysize && yysize <= yymsg_alloc)
	  {
	    (void) yysyntax_error (yymsg, yystate, yychar);
	    yyerror (yymsg);
	  }
	else
	  {
	    yyerror (YY_("syntax error"));
	    if (yysize != 0)
	      goto yyexhaustedlab;
	  }
      }
#endif
    }



  if (yyerrstatus == 3)
    {
      /* If just tried and failed to reuse lookahead token after an
	 error, discard it.  */

      if (yychar <= YYEOF)
	{
	  /* Return failure if at end of input.  */
	  if (yychar == YYEOF)
	    YYABORT;
	}
      else
	{
	  yydestruct ("Error: discarding",
		      yytoken, &yylval);
	  yychar = YYEMPTY;
	}
    }

  /* Else will try to reuse lookahead token after shifting the error
     token.  */
  goto yyerrlab1;


/*---------------------------------------------------.
| yyerrorlab -- error raised explicitly by YYERROR.  |
`---------------------------------------------------*/
yyerrorlab:

  /* Pacify compilers like GCC when the user code never invokes
     YYERROR and the label yyerrorlab therefore never appears in user
     code.  */
  if (/*CONSTCOND*/ 0)
     goto yyerrorlab;

  /* Do not reclaim the symbols of the rule which action triggered
     this YYERROR.  */
  YYPOPSTACK (yylen);
  yylen = 0;
  YY_STACK_PRINT (yyss, yyssp);
  yystate = *yyssp;
  goto yyerrlab1;


/*-------------------------------------------------------------.
| yyerrlab1 -- common code for both syntax error and YYERROR.  |
`-------------------------------------------------------------*/
yyerrlab1:
  yyerrstatus = 3;	/* Each real token shifted decrements this.  */

  for (;;)
    {
      yyn = yypact[yystate];
      if (yyn != YYPACT_NINF)
	{
	  yyn += YYTERROR;
	  if (0 <= yyn && yyn <= YYLAST && yycheck[yyn] == YYTERROR)
	    {
	      yyn = yytable[yyn];
	      if (0 < yyn)
		break;
	    }
	}

      /* Pop the current state because it cannot handle the error token.  */
      if (yyssp == yyss)
	YYABORT;


      yydestruct ("Error: popping",
		  yystos[yystate], yyvsp);
      YYPOPSTACK (1);
      yystate = *yyssp;
      YY_STACK_PRINT (yyss, yyssp);
    }

  *++yyvsp = yylval;


  /* Shift the error token.  */
  YY_SYMBOL_PRINT ("Shifting", yystos[yyn], yyvsp, yylsp);

  yystate = yyn;
  goto yynewstate;


/*-------------------------------------.
| yyacceptlab -- YYACCEPT comes here.  |
`-------------------------------------*/
yyacceptlab:
  yyresult = 0;
  goto yyreturn;

/*-----------------------------------.
| yyabortlab -- YYABORT comes here.  |
`-----------------------------------*/
yyabortlab:
  yyresult = 1;
  goto yyreturn;

#if !defined(yyoverflow) || YYERROR_VERBOSE
/*-------------------------------------------------.
| yyexhaustedlab -- memory exhaustion comes here.  |
`-------------------------------------------------*/
yyexhaustedlab:
  yyerror (YY_("memory exhausted"));
  yyresult = 2;
  /* Fall through.  */
#endif

yyreturn:
  if (yychar != YYEMPTY)
     yydestruct ("Cleanup: discarding lookahead",
		 yytoken, &yylval);
  /* Do not reclaim the symbols of the rule which action triggered
     this YYABORT or YYACCEPT.  */
  YYPOPSTACK (yylen);
  YY_STACK_PRINT (yyss, yyssp);
  while (yyssp != yyss)
    {
      yydestruct ("Cleanup: popping",
		  yystos[*yyssp], yyvsp);
      YYPOPSTACK (1);
    }
#ifndef yyoverflow
  if (yyss != yyssa)
    YYSTACK_FREE (yyss);
#endif
#if YYERROR_VERBOSE
  if (yymsg != yymsgbuf)
    YYSTACK_FREE (yymsg);
#endif
  /* Make sure YYID is used.  */
  return YYID (yyresult);
}



/* Line 1675 of yacc.c  */
#line 615 "bc.y"


