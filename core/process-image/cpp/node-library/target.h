#ifndef TARGET_H
#define TARGET_H

#ifdef __cplusplus
extern "C" {
#endif

struct Coordinate {
    int x;
    int y;
};

struct Target {
    char *originalImage;
    Coordinate topLeft;
    Coordinate bottomRight;

    char *orientation;
    char *shape;
    char *backgroundColor;
    char *alphanumeric;
    char *alphanumericColor;
};

Target *getTargets(char *image);

#ifdef __cplusplus
}
#endif

#endif
